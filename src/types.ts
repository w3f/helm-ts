import { CmdManager } from '@w3f/cmd';
import { Logger } from '@w3f/logger';
import { TemplateManager, TemplateData } from '@w3f/template';

export interface Repo {
    name: string;
    url: string;
}

export type RepoList = Array<Repo>;

export interface ChartValuesTemplate {
    path: string;
    data: TemplateData;
}

export interface HelmConfig {
    binaryPath: string;
    kubeconfig: string;
    cmd: CmdManager;
    tpl?: TemplateManager;
    logger: Logger;
}

export interface ChartConfig {
    name: string;
    chart: string;
    valuesTemplate?: ChartValuesTemplate;
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
