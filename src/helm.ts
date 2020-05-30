import fs from 'fs-extra';
import tmp from 'tmp';
import { CmdManager, Cmd } from '@w3f/cmd';
import { Components } from '@w3f/components';
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

    static async create(kubeconfig: string, logger: Logger): Promise<Helm> {
        const cmCfg = {
            'helm': 'https://w3f.github.io/components-ts/downloads/linux-amd64/helm/3.2.1/helm.tar.gz'
        };
        const cm = new Components('helm-test', cmCfg, logger);
        const binaryPath = await cm.path('helm');

        const cmd = new Cmd(logger);

        const cfg = {
            binaryPath,
            kubeconfig,
            cmd,
            logger
        };

        return new Helm(cfg);
    }

    constructor(helmCfg: HelmConfig) {
        this.binaryPath = helmCfg.binaryPath;
        this.cmd = helmCfg.cmd;
        this.kubeconfig = helmCfg.kubeconfig;
        this.tpl = helmCfg.tpl;
        this.logger = helmCfg.logger;

        this.cmd.setOptions({ verbose: true });
    }

    async install(chartCfg: ChartConfig): Promise<void> {
        let valuesFile = '';
        const options = [
            'upgrade',
            chartCfg.name,
            chartCfg.chart,
            '--install'
        ];
        if (chartCfg.wait) {
            options.push('--wait');
        }
        if (chartCfg.ns) {
            options.push('--namespace', chartCfg.ns);
        }

        if (chartCfg.valuesTemplate) {
            const tmpobj = tmp.fileSync();
            valuesFile = tmpobj.name;
            this.tpl.create(chartCfg.valuesTemplate.path, valuesFile, chartCfg.valuesTemplate.data);
            options.push('--values', valuesFile);
        }

        try {
            await this.exec(...options);
        } catch (e) {
            if (valuesFile) {
                fs.unlink(valuesFile);
            }
            throw (e);
        }
    }

    async uninstall(name: string, ns?: string): Promise<void> {
        if (!ns) {
            ns = 'default';
        }
        const options = [
            'del',
            '-n',
            ns,
            name
        ];
        await this.exec(...options);
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
