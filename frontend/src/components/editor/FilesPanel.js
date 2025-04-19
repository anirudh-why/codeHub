import React from 'react';
import { FiFile, FiFolder, FiChevronDown, FiChevronRight, FiTrash2, FiPlusCircle } from 'react-icons/fi';

function FilesPanel({
  filesStructure,
  expandedFolders,
  toggleFolder,
  activeFile,
  setActiveFile,
  loadFileContent,
  userRole,
  deleteFileOrFolder,
  isCreatingFile,
  setIsCreatingFile,
  newFileName,
  setNewFileName,
  createNewFile,
  isCreatingFolder,
  setIsCreatingFolder,
  newFolderName,
  setNewFolderName,
  createNewFolder,
  saveFileContent
}) {
  // Render file tree structure recursively
  const renderFileTree = (items, level = 0) => {
    return items.map(item => {
      const isFolder = item.type === 'folder';
      const isExpanded = expandedFolders[item._id];
      const isActive = activeFile && activeFile._id === item._id;
      
      return (
        <div key={item._id} style={{ paddingLeft: `${level * 12}px` }}>
          <div 
            className={`flex items-center p-1 hover:bg-gray-700 rounded ${isActive ? 'bg-gray-700' : ''}`}
          >
            {isFolder ? (
              <button 
                onClick={() => toggleFolder(item._id)} 
                className="p-1 text-gray-400 hover:text-white"
              >
                {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
              </button>
            ) : (
              <FiFile size={14} className="ml-1 mr-1 text-gray-400" />
            )}
            
            <div 
              className={`flex-1 text-sm truncate cursor-pointer ml-1 ${isFolder ? 'font-medium' : ''}`}
              onClick={() => {
                if (isFolder) {
                  toggleFolder(item._id);
                } else {
                  setActiveFile(item);
                  loadFileContent(item._id);
                }
              }}
            >
              {item.name}
            </div>
            
            {userRole !== 'viewer' && (
              <button
                onClick={() => deleteFileOrFolder(item)}
                className="p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100"
                title={`Delete ${isFolder ? 'folder' : 'file'}`}
              >
                <FiTrash2 size={14} />
              </button>
            )}
          </div>
          
          {isFolder && isExpanded && item.children && item.children.length > 0 && (
            <div className="ml-2">
              {renderFileTree(item.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col p-3">
      {/* Files Header */}
      {userRole !== 'viewer' && (
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold">Workspace Files</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsCreatingFile(true)}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded flex items-center gap-1"
              title="New File"
            >
              <FiFile size={12} /> File
            </button>
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded flex items-center gap-1"
              title="New Folder"
            >
              <FiFolder size={12} /> Folder
            </button>
          </div>
        </div>
      )}
      
      {/* New File Form */}
      {isCreatingFile && (
        <form onSubmit={createNewFile} className="mb-3 bg-gray-700 p-2 rounded">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="w-full bg-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2"
            placeholder="File name"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingFile(false)}
              className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
            >
              Create
            </button>
          </div>
        </form>
      )}
      
      {/* New Folder Form */}
      {isCreatingFolder && (
        <form onSubmit={createNewFolder} className="mb-3 bg-gray-700 p-2 rounded">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="w-full bg-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2"
            placeholder="Folder name"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
            >
              Create
            </button>
          </div>
        </form>
      )}
      
      {/* File Tree */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filesStructure.length > 0 ? (
          renderFileTree(filesStructure)
        ) : (
          <div className="text-center text-gray-400 py-4">
            No files in this workspace yet
          </div>
        )}
      </div>
      
      {/* Save Button */}
      {activeFile && userRole !== 'viewer' && (
        <button
          onClick={saveFileContent}
          className="mt-3 w-full bg-green-600 hover:bg-green-700 rounded py-2 text-sm"
        >
          Save File
        </button>
      )}
    </div>
  );
}

export default FilesPanel; 