import { CmdManager } from '@w3f/cmd';
import { Logger } from '@w3f/logger';
import { TemplateManager } from '@w3f/template';

export interface Repo {
    name: string;
    url: string;
}

export type RepoList = Array<Repo>;

export interface ChartValuesTemplate {
    path: string;
    data: string;
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
}

export interface HelmManager {
    install(chart: ChartConfig): Promise<void>;
    uninstall(name: string): Promise<void>;
    addRepos(repos: RepoList): Promise<void>;
}
