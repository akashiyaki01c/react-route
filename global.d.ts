declare global {
  interface Window {
    showOpenFilePicker: (
      options?: OpenFilePickerOptions
    ) => Promise<FileSystemFileHandle[]>;

    showSaveFilePicker: (
      options?: SaveFilePickerOptions
    ) => Promise<FileSystemFileHandle>;

    showDirectoryPicker: (
      options?: DirectoryPickerOptions
    ) => Promise<FileSystemDirectoryHandle>;
  }
}

interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface OpenFilePickerOptions {
  multiple?: boolean;
  types?: FilePickerAcceptType[];
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
}

interface DirectoryPickerOptions {
  mode?: "read" | "readwrite";
}

export {};
