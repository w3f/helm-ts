import fs from 'fs-extra';
import { should } from 'chai';
import path from 'path';
import tmp from 'tmp';
import { Components } from '@w3f/components';
import { Cmd } from '@w3f/cmd';
import { Kind } from '@w3f/kind';
import * as k8s from '@kubernetes/client-node';

import { Helm } from '../src/index';
import { ChartConfig } from '../src/types';
import {
    LoggerMock,
    TplMock
} from './mocks';

should();

const kc = new k8s.KubeConfig();

const logger = new LoggerMock();
const tpl = new TplMock();

const cmCfg = {
    'helm': 'https://w3f.github.io/components-ts/downloads/linux-amd64/helm/3.2.1/helm.tar.gz',
    'kind': 'https://w3f.github.io/components-ts/downloads/linux-amd64/kind/0.8.1/kind.tar.gz'
};
const cm = new Components('helm-test', cmCfg, logger);
const cmd = new Cmd(logger);

let subject: Helm;
let kind: Kind;

describe('Helm', () => {
    before(async () => {
        const helmPath = await cm.path('helm');
        const kindPath = await cm.path('kind');

        subject = new Helm(helmPath, cmd, tpl, logger);

        kind = new Kind(kindPath, cmd, logger);
        await kind.start();

        const kubeconfigContent = await kind.kubeconfig() as string;

        kc.loadFromString(kubeconfigContent);
    });

    after(async () => {
        await kind.stop();
    });

    describe('install', () => {
        it('should install a local chart', async () => {
            const chart = path.join(__dirname, 'test');
            const chartCfg: ChartConfig = {
                name: 'test',
                chart
            };

        });
        it('should install a remote chart from stable');
        it('should install a remote chart from a custom repo');
        it('should allow to pass values');
    });
    describe('uninstall', () => {
        it('should uninstall charts');
    });
});
