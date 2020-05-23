import { Logger } from '@w3f/logger';
import { TemplateManager, TemplateData } from '@w3f/template';
import { CmdManager } from '@w3f/cmd';

import { HelmManager } from './types';

export class Helm implements HelmManager {
    constructor(
        private readonly binPath: string,
        private readonly cmd: CmdManager,
        private readonly tpl: TemplateManager,
        private readonly logger: Logger) { }

    install(data: TemplateData): Promise<void> {
        return
    }

    uninstall(): Promise<void> {
        return
    }
}
