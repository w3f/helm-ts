import { Logger } from '@w3f/logger';
import { TemplateManager } from '@w3f/template';
import { CmdManager } from '@w3f/cmd';

import { HelmManager, Chart } from './types';

export class Helm implements HelmManager {
    constructor(
        private readonly binPath: string,
        private readonly cmd: CmdManager,
        private readonly tpl: TemplateManager,
        private readonly logger: Logger) { }

    install(chart: Chart): Promise<void> {
        return
    }

    uninstall(name: string): Promise<void> {
        return
    }
}
