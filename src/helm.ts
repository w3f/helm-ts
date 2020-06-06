import fs from 'fs-extra';
import tmp from 'tmp';
import { CmdManager, Cmd } from '@w3f/cmd';
import { Components } from '@w3f/components';
import { Logger, createLogger } from '@w3f/logger';
import { TemplateManager, Template } from '@w3f/template';

import {
    HelmManager,
    HelmConfig,
    HelmAction,
    ChartConfig,
    RepoList
} from './types';

export class Helm implements HelmManager {
    private readonly binaryPath: string;
    private readonly cmd: CmdManager;
    private kubeconfig: string;
    private readonly tpl: TemplateManager;
    private readonly logger: Logger

    static async createBare(): Promise<Helm> {
        const logger = createLogger();

        return this.create('', logger);
    }

    static async create(kubeconfig: string, logger: Logger): Promise<Helm> {
        const cmCfg = {
            'helm': 'https://w3f.github.io/components-ts/downloads/linux-amd64/helm/3.2.1/helm.tar.gz'
        };
        const cm = new Components('helm-test', cmCfg, logger);
        const binaryPath = await cm.path('helm');

        const cmd = new Cmd(logger);
        const tpl = new Template();
        const cfg = {
            binaryPath,
            kubeconfig,
            cmd,
            tpl,
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
        await this.commonActions(HelmAction.Install, chartCfg);
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

    async template(chartCfg: ChartConfig): Promise<string> {
        const result = await this.commonActions(HelmAction.Template, chartCfg);
        return result as string;
    }

    setKubeconfig(kubeconfig: string): void {
        this.kubeconfig = kubeconfig;
    }

    private async commonActions(action: HelmAction, chartCfg: ChartConfig): Promise<string | number> {
        let valuesFile = '';
        let options: Array<string> = [];
        switch (action) {
            case HelmAction.Install:
                options = [
                    'upgrade',
                    chartCfg.name,
                    chartCfg.chart,
                    '--install'
                ];
                break;
            case HelmAction.Template:
                options = [
                    'template',
                    chartCfg.name,
                    chartCfg.chart,
                ];
                break;
            default:
                throw new Error(`Unknown Helm action: ${action}`);
        }
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

        if (chartCfg.version) {
            options.push('--version', chartCfg.version);
        }

        try {
            return this.exec(...options);
        } catch (e) {
            if (valuesFile) {
                fs.unlink(valuesFile);
            }
            throw (e);
        }
    }

    private async exec(...args: string[]): Promise<string | number> {
        args.push(`--kubeconfig=${this.kubeconfig}`);

        return this.cmd.exec(`${this.binaryPath}`, ...args);
    }
}
