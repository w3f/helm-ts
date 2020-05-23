import { TemplateData } from '@w3f/template';

export interface HelmManager {
    install(data: TemplateData): Promise<void>;
    uninstall(): Promise<void>;
}
