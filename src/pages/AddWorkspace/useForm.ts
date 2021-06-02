/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePromiseValue, usePromiseValueAndSetter } from '@/helpers/useServiceValue';
import { useStorageServiceUserInfo } from '@services/auth/hooks';
import { SupportedStorageServices } from '@services/types';
import { ISubWikiPluginContent } from '@services/wiki/updatePluginContent';
import { INewWorkspaceConfig, IWorkspace } from '@services/workspaces/interface';

export function useIsCreateMainWorkspace(): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [isCreateMainWorkspace, isCreateMainWorkspaceSetter] = useState(false);
  useEffect(() => {
    void window.service.workspace.countWorkspaces().then((workspaceCount) => isCreateMainWorkspaceSetter(workspaceCount === 0));
  }, []);
  return [isCreateMainWorkspace, isCreateMainWorkspaceSetter];
}

export function useIsCreateSyncedWorkspace(): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [isCreateSyncedWorkspace, isCreateSyncedWorkspaceSetter] = useState(false);
  useEffect(() => {
    void window.service.auth.getRandomStorageServiceUserInfo().then((result) => isCreateSyncedWorkspaceSetter(result !== undefined));
  }, []);
  return [isCreateSyncedWorkspace, isCreateSyncedWorkspaceSetter];
}

export type IWikiWorkspaceForm = ReturnType<typeof useWikiWorkspaceForm>;
export type IErrorInWhichComponent = Partial<Record<keyof IWikiWorkspaceForm, boolean>>;
export interface IWikiWorkspaceFormProps {
  form: IWikiWorkspaceForm;
  isCreateMainWorkspace: boolean;
  errorInWhichComponent: IErrorInWhichComponent;
  errorInWhichComponentSetter: (errors: IErrorInWhichComponent) => void;
}
export function useWikiWorkspaceForm() {
  const { t } = useTranslation();

  const workspaceList = usePromiseValue(async () => await window.service.workspace.getWorkspacesAsList()) ?? [];

  const [wikiPort, wikiPortSetter] = useState(5212);
  useEffect(() => {
    // only update default port on component mount
    void window.service.workspace.countWorkspaces().then((workspaceCount) => wikiPortSetter(wikiPort + workspaceCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Set storage service used by this workspace, for example, Github.
   */
  const [storageProvider, storageProviderSetter] = useState<SupportedStorageServices>(SupportedStorageServices.local);
  const gitUserInfo = useStorageServiceUserInfo(storageProvider);

  /**
   * Update tiddlywiki's editor user name when first time creating new workspace
   */
  const [userName, userNameSetter] = usePromiseValueAndSetter(
    async () => await window.service.auth.get('userName'),
    async (newUserName) => {
      if (newUserName !== undefined) await window.service.auth.set('userName', newUserName);
    },
  );

  /**
   * For sub-wiki, we need to link it to a main wiki's folder, so all wiki contents can be loaded together.
   */
  const mainWorkspaceList = workspaceList.filter((workspace) => !workspace.isSubWiki);
  const [mainWikiToLink, mainWikiToLinkSetter] = useState<Pick<IWorkspace, 'wikiFolderLocation' | 'port' | 'id'>>(
    mainWorkspaceList[0] ?? { wikiFolderLocation: '', port: 0, id: '' },
  );
  const [tagName, tagNameSetter] = useState<string>('');
  let mainWikiToLinkIndex = mainWorkspaceList.findIndex((workspace) => workspace.id === mainWikiToLink.id);
  if (mainWikiToLinkIndex < 0) {
    mainWikiToLinkIndex = 0;
  }
  useEffect(() => {
    if (mainWorkspaceList[mainWikiToLinkIndex]?.wikiFolderLocation) {
      mainWikiToLinkSetter(mainWorkspaceList[mainWikiToLinkIndex]);
    }
  }, [mainWorkspaceList, mainWikiToLinkIndex]);
  /**
   * For sub-wiki, we need `fileSystemPaths` which is a TiddlyWiki concept that tells wiki where to put sub-wiki files.
   */
  const [fileSystemPaths, fileSystemPathsSetter] = useState<ISubWikiPluginContent[]>([]);
  useEffect(() => {
    void window.service.wiki.getSubWikiPluginContent(mainWikiToLink.wikiFolderLocation).then(fileSystemPathsSetter);
  }, [mainWikiToLink]);
  /**
   * For importing existed nodejs wiki into TiddlyGit, we use existedWikiFolderPath to determine which folder to import
   */
  const [existedWikiFolderPath, existedWikiFolderPathSetter] = useState<string>('');
  /**
   * For creating new wiki, we use parentFolderLocation to determine in which folder we create the new wiki folder.
   * New folder will basically be created in `${parentFolderLocation}/${wikiFolderName}`
   */
  const [parentFolderLocation, parentFolderLocationSetter] = useState<string>('');
  /**
   * For creating new wiki, we put `tiddlers` folder in this `${parentFolderLocation}/${wikiFolderName}` folder
   */
  const [wikiFolderName, wikiFolderNameSetter] = useState('tiddlywiki');

  useEffect(() => {
    void (async function getDefaultExistedWikiFolderPathEffect() {
      const desktopPathAsDefaultExistedWikiFolderPath = await window.service.context.get('DEFAULT_WIKI_FOLDER');
      existedWikiFolderPathSetter(desktopPathAsDefaultExistedWikiFolderPath);
      parentFolderLocationSetter(desktopPathAsDefaultExistedWikiFolderPath);
    })();
  }, [mainWikiToLink]);
  const [gitRepoUrl, gitRepoUrlSetter] = useState<string>('');

  useEffect(() => {
    void (async function getWorkspaceRemoteEffect(): Promise<void> {
      if (existedWikiFolderPath !== undefined) {
        const url = await window.service.git.getWorkspacesRemote(existedWikiFolderPath);
        if (typeof url === 'string' && url.length > 0) {
          gitRepoUrlSetter(url);
        }
      }
    })();
  }, [gitRepoUrlSetter, existedWikiFolderPath]);

  // derived values
  const wikiFolderLocation = `${parentFolderLocation ?? t('Error') ?? 'Error'}/${wikiFolderName}`;

  return {
    storageProvider,
    storageProviderSetter,
    wikiPort,
    wikiPortSetter,
    userName,
    userNameSetter,
    mainWikiToLink,
    mainWikiToLinkSetter,
    tagName,
    tagNameSetter,
    fileSystemPaths,
    fileSystemPathsSetter,
    gitRepoUrl,
    gitRepoUrlSetter,
    existedWikiFolderPath,
    existedWikiFolderPathSetter,
    parentFolderLocation,
    parentFolderLocationSetter,
    wikiFolderName,
    wikiFolderNameSetter,
    gitUserInfo,
    wikiFolderLocation,
    workspaceList,
    mainWorkspaceList,
    mainWikiToLinkIndex,
  };
}

export function workspaceConfigFromForm(form: IWikiWorkspaceForm, isCreateMainWorkspace: boolean, isCreateSyncedWorkspace: boolean): INewWorkspaceConfig {
  return {
    gitUrl: isCreateSyncedWorkspace ? form.gitRepoUrl : null,
    isSubWiki: !isCreateMainWorkspace,
    mainWikiToLink: !isCreateMainWorkspace ? form.mainWikiToLink.wikiFolderLocation : null,
    name: form.wikiFolderName,
    storageService: form.storageProvider,
    tagName: !isCreateMainWorkspace ? form.tagName : null,
    port: form.wikiPort,
    wikiFolderLocation: form.wikiFolderLocation,
  };
}