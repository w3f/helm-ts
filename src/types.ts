import { TemplateData } from '@w3f/template';

export interface ChartValuesTemplate {
    path: string;
    data: string;
}

export interface ChartConfig {
    name: string;
    chart: string;
    valuesTemplate?: ChartValuesTemplate;
    repo?: string;
}

export interface HelmManager {
    install(chart: ChartConfig): Promise<void>;
    uninstall(name: string): Promise<void>;
}
