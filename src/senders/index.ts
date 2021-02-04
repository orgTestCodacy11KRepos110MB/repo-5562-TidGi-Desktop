import { ipcRenderer } from 'electron';
import { ContextChannel } from '@/constants/channels';

export const requestOpen = async (uri: string, isDirectory: boolean): Promise<void> => {
  await ipcRenderer.invoke('request-open', uri, !!isDirectory);
};
export const requestQuit = async (): Promise<void> => {
  await ipcRenderer.invoke('request-quit');
};

// Native Theme
export const getShouldUseDarkColors = async (): Promise<void> => {
  await ipcRenderer.invoke('get-should-use-dark-colors');
};

// call NodeJS.path
export const getBaseName = async (pathString: string): Promise<string> => {
  const result = (await ipcRenderer.invoke(ContextChannel.getBaseName, pathString)) as string;
  if (typeof result === 'string') return result;
  throw new Error(`getBaseName get bad result ${typeof result}`);
};
export const getDirectoryName = async (pathString: string): Promise<string> => {
  const result = (await ipcRenderer.invoke(ContextChannel.getDirectoryName, pathString)) as string;
  if (typeof result === 'string') return result;
  throw new Error(`getDirectoryName get bad result ${typeof result}`);
};

// Online Status
export const signalOnlineStatusChanged = async (online: boolean) => await ipcRenderer.invoke('online-status-changed', online);
