import { CmdManager } from '@w3f/cmd';
import { Logger } from '@w3f/logger';
import { TemplateManager } from '@w3f/template';

import {
    HelmManager,
    HelmConfig,
    ChartConfig,
    RepoList
} from './types';

export class Helm implements HelmManager {
    private readonly binaryPath: string;
    private readonly cmd: CmdManager;
    private readonly kubeconfig: string;
    private readonly tpl: TemplateManager;
    private readonly logger: Logger

    constructor(helmCfg: HelmConfig) {
        this.binaryPath = helmCfg.binaryPath;
        this.cmd = helmCfg.cmd;
        this.kubeconfig = helmCfg.kubeconfig;
        this.tpl = helmCfg.tpl;
        this.logger = helmCfg.logger;

        this.cmd.setOptions({ verbose: true });
    }

    async install(chartCfg: ChartConfig): Promise<string> {
        const options = [
            'upgrade',
            chartCfg.name,
            chartCfg.chart,
            '--install'
        ];
        if (chartCfg.wait) {
            options.push('--wait');
        }

        const result = await this.exec(...options) as string;
        return result;
    }

    async uninstall(name: string): Promise<string> {
        return '';
    }

    async addRepos(repos: RepoList): Promise<void> {
        for (let i = 0; i < repos.length; i++) {
            await this.exec('repo', 'add', repos[i].name, repos[i].url);
        }
        await this.exec('repo', 'update');
    }

    private async exec(...args: string[]): Promise<string | number> {
        args.push(`--kubeconfig=${this.kubeconfig}`);

        return this.cmd.exec(`${this.binaryPath}`, ...args);
    }
}
