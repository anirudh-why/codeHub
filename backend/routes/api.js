const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const File = require('../models/File');
const Folder = require('../models/Folder');
const io = require('../utils/io').getIO();

// Execute code
router.post('/execute', async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }
    
    if (!language) {
      return res.status(400).json({ error: 'No language specified' });
    }
    
    // Execute the code based on language
    let output = '';
    
    switch (language.toLowerCase()) {
      case 'javascript':
        // Execute JavaScript code using Node.js
        output = await executeJavaScript(code);
        break;
        
      case 'python':
        // Execute Python code
        output = await executePython(code);
        break;
      
      case 'java':
        // Execute Java code
        output = await executeJava(code);
        break;
        
      case 'c':
      case 'cpp':
        // Execute C/C++ code
        output = await executeCpp(code, language.toLowerCase());
        break;
        
      default:
        return res.status(400).json({ error: `Unsupported language: ${language}` });
    }
    
    return res.json({ output });
  } catch (error) {
    console.error('Error executing code:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while executing the code' });
  }
});

// Helper functions for code execution
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);
const writeFilePromise = util.promisify(fs.writeFile);
const unlinkPromise = util.promisify(fs.unlink);
const mkdirPromise = util.promisify(fs.mkdir);

// Create temp directory if it doesn't exist
const ensureTempDir = async () => {
  const tempDir = path.join(__dirname, '../temp');
  try {
    await mkdirPromise(tempDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  return tempDir;
};

// Execute JavaScript code
const executeJavaScript = async (code) => {
  try {
    const tempDir = await ensureTempDir();
    const fileName = `temp_${Date.now()}.js`;
    const filePath = path.join(tempDir, fileName);
    
    // Write code to temp file
    await writeFilePromise(filePath, code);
    
    // Execute code with timeout
    const { stdout, stderr } = await execPromise(`node "${filePath}"`, { timeout: 5000 });
    
    // Clean up temp file
    await unlinkPromise(filePath);
    
    return stderr ? `Error: ${stderr}` : stdout;
  } catch (error) {
    if (error.killed && error.signal === 'SIGTERM') {
      return 'Error: Execution timed out (5 seconds max)';
    }
    return `Error: ${error.message}`;
  }
};

// Execute Python code
const executePython = async (code) => {
  try {
    const tempDir = await ensureTempDir();
    const fileName = `temp_${Date.now()}.py`;
    const filePath = path.join(tempDir, fileName);
    
    // Write code to temp file
    await writeFilePromise(filePath, code);
    
    // Execute code with timeout
    const { stdout, stderr } = await execPromise(`python "${filePath}"`, { timeout: 5000 });
    
    // Clean up temp file
    await unlinkPromise(filePath);
    
    return stderr ? `Error: ${stderr}` : stdout;
  } catch (error) {
    if (error.killed && error.signal === 'SIGTERM') {
      return 'Error: Execution timed out (5 seconds max)';
    }
    return `Error: ${error.message}`;
  }
};

// Execute Java code
const executeJava = async (code) => {
  try {
    const tempDir = await ensureTempDir();
    const className = `TempJava${Date.now()}`;
    const fileName = `${className}.java`;
    const filePath = path.join(tempDir, fileName);
    
    // Insert class name into code
    const modifiedCode = code.replace(/public\s+class\s+\w+/g, `public class ${className}`);
    
    // Write code to temp file
    await writeFilePromise(filePath, modifiedCode);
    
    // Compile Java code
    try {
      await execPromise(`javac "${filePath}"`, { timeout: 5000 });
    } catch (compileError) {
      await unlinkPromise(filePath);
      return `Compilation Error: ${compileError.stderr}`;
    }
    
    // Execute Java code
    try {
      const { stdout, stderr } = await execPromise(`java -cp "${tempDir}" ${className}`, { timeout: 5000 });
      return stderr ? `Error: ${stderr}` : stdout;
    } finally {
      // Clean up temp files
      try {
        await unlinkPromise(filePath);
        await unlinkPromise(path.join(tempDir, `${className}.class`));
      } catch (cleanupError) {
        console.error('Error cleaning up Java files:', cleanupError);
      }
    }
  } catch (error) {
    if (error.killed && error.signal === 'SIGTERM') {
      return 'Error: Execution timed out (5 seconds max)';
    }
    return `Error: ${error.message}`;
  }
};

// Execute C/C++ code
const executeCpp = async (code, language) => {
  try {
    const tempDir = await ensureTempDir();
    const fileExt = language === 'c' ? '.c' : '.cpp';
    const fileName = `temp_${Date.now()}${fileExt}`;
    const filePath = path.join(tempDir, fileName);
    const outputPath = path.join(tempDir, `temp_${Date.now()}.exe`);
    
    // Write code to temp file
    await writeFilePromise(filePath, code);
    
    // Compile C/C++ code
    const compiler = language === 'c' ? 'gcc' : 'g++';
    try {
      await execPromise(`${compiler} "${filePath}" -o "${outputPath}"`, { timeout: 5000 });
    } catch (compileError) {
      await unlinkPromise(filePath);
      return `Compilation Error: ${compileError.stderr}`;
    }
    
    // Execute compiled code
    try {
      const { stdout, stderr } = await execPromise(`"${outputPath}"`, { timeout: 5000 });
      return stderr ? `Error: ${stderr}` : stdout;
    } finally {
      // Clean up temp files
      try {
        await unlinkPromise(filePath);
        await unlinkPromise(outputPath);
      } catch (cleanupError) {
        console.error('Error cleaning up C/C++ files:', cleanupError);
      }
    }
  } catch (error) {
    if (error.killed && error.signal === 'SIGTERM') {
      return 'Error: Execution timed out (5 seconds max)';
    }
    return `Error: ${error.message}`;
  }
};

// Get file structure for a room
router.get('/rooms/:roomId/files', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // First, find the Room by its link to get the MongoDB _id
    const room = await Room.findOne({ link: roomId });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Get all files and folders for this room using the MongoDB _id
    const [files, folders] = await Promise.all([
      File.find({ room: room._id }),
      Folder.find({ room: room._id })
    ]);
    
    // Build the file tree structure
    const fileTree = buildFileTree(files, folders);
    
    res.json(fileTree);
  } catch (error) {
    console.error('Error getting file structure:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to build file tree structure
function buildFileTree(files, folders) {
  // Create a map of all folders by ID
  const folderMap = {};
  folders.forEach(folder => {
    folderMap[folder._id] = {
      _id: folder._id,
      name: folder.name,
      type: 'folder',
      parent: folder.parent,
      children: []
    };
  });
  
  // Add files to their parent folders
  files.forEach(file => {
    const fileObj = {
      _id: file._id,
      name: file.name,
      type: 'file',
      parent: file.parent,
      language: file.language
    };
    
    if (file.parent && folderMap[file.parent]) {
      folderMap[file.parent].children.push(fileObj);
    }
  });
  
  // Add folders to their parent folders
  folders.forEach(folder => {
    if (folder.parent && folderMap[folder.parent]) {
      folderMap[folder.parent].children.push(folderMap[folder._id]);
    }
  });
  
  // Get root items (no parent)
  const rootItems = [
    ...files.filter(file => !file.parent).map(file => ({
      _id: file._id,
      name: file.name,
      type: 'file',
      language: file.language
    })),
    ...folders.filter(folder => !folder.parent).map(folder => folderMap[folder._id])
  ];
  
  // Sort items: folders first, then files, both alphabetically
  rootItems.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  
  // Sort children of all folders the same way
  Object.values(folderMap).forEach(folder => {
    folder.children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  });
  
  return rootItems;
}

// Get file content
router.get('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({ content: file.content, language: file.language });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update file content
router.put('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { content } = req.body;
    
    const file = await File.findByIdAndUpdate(
      fileId, 
      { content, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(file);
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new file
router.post('/rooms/:roomId/files', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, parent, content = '', language = 'javascript' } = req.body;
    
    // Check if room exists by link field
    const room = await Room.findOne({ link: roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Create new file using the room's MongoDB _id
    const newFile = new File({
      name,
      content,
      language,
      parent,
      room: room._id,
      createdBy: req.body.createdBy || 'anonymous'
    });
    
    await newFile.save();
    
    // Emit file structure change event to Socket.IO
    io.to(roomId).emit('fileStructureChange', { roomId });
    
    res.status(201).json(newFile);
  } catch (error) {
    console.error('Error creating file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new folder
router.post('/rooms/:roomId/folders', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, parent } = req.body;
    
    // Check if room exists by link field
    const room = await Room.findOne({ link: roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Create new folder using the room's MongoDB _id
    const newFolder = new Folder({
      name,
      parent,
      room: room._id,
      createdBy: req.body.createdBy || 'anonymous'
    });
    
    await newFolder.save();
    
    // Emit file structure change event to Socket.IO
    io.to(roomId).emit('fileStructureChange', { roomId });
    
    res.status(201).json(newFolder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete file
router.delete('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await File.findByIdAndDelete(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Emit file structure change event to Socket.IO
    const fileRoom = await Room.findById(file.room);
    if (fileRoom) {
      io.to(fileRoom.link).emit('fileStructureChange', { roomId: fileRoom.link });
    }
    
    res.json({ message: 'File deleted' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete folder
router.delete('/folders/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    
    // Find folder
    const folder = await Folder.findById(folderId);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Get room link for emitting events
    const folderRoom = await Room.findById(folder.room);
    const roomLink = folderRoom ? folderRoom.link : null;
    
    // Delete all files in this folder
    await File.deleteMany({ parent: folderId });
    
    // Delete all subfolders recursively
    await deleteSubfolders(folderId);
    
    // Delete the folder itself
    await Folder.findByIdAndDelete(folderId);
    
    // Emit file structure change event to Socket.IO
    if (roomLink) {
      io.to(roomLink).emit('fileStructureChange', { roomId: roomLink });
    }
    
    res.json({ message: 'Folder and all contents deleted' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to recursively delete subfolders
async function deleteSubfolders(folderId) {
  // Find all direct subfolders
  const subfolders = await Folder.find({ parent: folderId });
  
  // For each subfolder, recursively delete its contents
  for (const subfolder of subfolders) {
    // Delete all files in this subfolder
    await File.deleteMany({ parent: subfolder._id });
    
    // Delete all sub-subfolders
    await deleteSubfolders(subfolder._id);
    
    // Delete the subfolder itself
    await Folder.findByIdAndDelete(subfolder._id);
  }
}

module.exports = router; 