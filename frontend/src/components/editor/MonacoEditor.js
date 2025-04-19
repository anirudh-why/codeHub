import React from 'react';
import Editor from '@monaco-editor/react';

function MonacoEditor({ 
  code, 
  language,
  onChange, 
  onMount, 
  isReadOnly = false 
}) {
  return (
    <Editor
      height="100%"
      defaultLanguage={language || "javascript"}
      value={code}
      onChange={onChange}
      onMount={onMount}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        readOnly: isReadOnly
      }}
    />
  );
}

export default MonacoEditor; 