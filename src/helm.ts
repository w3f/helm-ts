import { CmdManager } from '@w3f/cmd';
import { Logger } from '@w3f/logger';
import { TemplateManager } from '@w3f/template';

import { HelmManager, HelmConfig, ChartConfig } from './types';

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
        const result = await this.exec(
            'upgrade',
            chartCfg.name,
            chartCfg.chart,
            '--install',
            '--kubeconfig',
            this.kubeconfig,
            '--wait'
        ) as string;
        return result;
    }

    async uninstall(name: string): Promise<string> {
        return '';
    }

    private async exec(...args: string[]): Promise<string | number> {
        return this.cmd.exec(`${this.binaryPath}`, ...args);
    }
}
