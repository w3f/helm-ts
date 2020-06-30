import { CmdManager } from '@w3f/cmd';
import { Logger } from '@w3f/logger';

export interface Repo {
    name: string;
    url: string;
}

export type RepoList = Array<Repo>;

export interface HelmConfig {
    binaryPath: string;
    kubeconfig: string;
    cmd: CmdManager;
    logger: Logger;
}

export interface ChartConfig {
    name: string;
    chart: string;
    values?: any;
    repo?: string;
    wait?: boolean;
    ns?: string;
    version?: string;
}

export interface HelmManager {
    install(chart: ChartConfig): Promise<void>;
    uninstall(name: string): Promise<void>;
    addRepos(repos: RepoList): Promise<void>;
    template(chart: ChartConfig): Promise<string>;
    setKubeconfig(kubeconfig: string): void;
}

export enum HelmAction {
    Install = 'install',
    Template = 'template'
}
