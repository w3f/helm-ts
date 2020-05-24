import fs from 'fs-extra';
import { should } from 'chai';
import path from 'path';
import tmp from 'tmp';
import { Cmd } from '@w3f/cmd';
import { Components } from '@w3f/components';
import { Kind } from '@w3f/kind';
import { createLogger } from '@w3f/logger';
import { Template } from '@w3f/template';
import * as k8s from '@kubernetes/client-node';

import { Helm } from '../src/index';
import { ChartConfig } from '../src/types';

should();

const kc = new k8s.KubeConfig();

const logger = createLogger();
const tpl = new Template();

const cmCfg = {
    'helm': 'https://w3f.github.io/components-ts/downloads/linux-amd64/helm/3.2.1/helm.tar.gz',
    'kind': 'https://w3f.github.io/components-ts/downloads/linux-amd64/kind/0.7.0/kind.tar.gz'
};
const cm = new Components('helm-test', cmCfg, logger);
const cmd = new Cmd(logger);

let subject: Helm;
let kind: Kind;
let k8sApi: k8s.CoreV1Api;

describe('Helm', () => {
    before(async () => {
        const binaryPath = await cm.path('helm');
        const kindPath = await cm.path('kind');

        kind = new Kind(kindPath, cmd, logger);
        await kind.start();

        const kubeconfigContent = await kind.kubeconfig() as string;

        const tmpobj = tmp.fileSync();
        const kubeconfig = tmpobj.name;
        fs.writeFileSync(kubeconfig, kubeconfigContent);

        const helmCfg = {
            binaryPath,
            cmd,
            tpl,
            logger,
            kubeconfig
        }
        subject = new Helm(helmCfg);

        kc.loadFromString(kubeconfigContent);
        k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    });

    after(async () => {
        await kind.stop();
    });

    describe('install', () => {
        it('should install a local chart', async () => {
            const chart = path.join(__dirname, 'charts', 'test');
            const chartCfg: ChartConfig = {
                name: 'test',
                chart,
                wait: true
            };

            await subject.install(chartCfg);

            const pods = await k8sApi.listNamespacedPod('default');
            pods.body.items.length.should.eq(2);

            pods.body.items.forEach((pod) => {
                pod.metadata.labels['app'].should.eq('test');
            });
        });
        it('should install a remote chart from stable');
        it('should install a remote chart from a custom repo');
        it('should allow to pass values');
    });
    describe('uninstall', () => {
        it('should uninstall charts');
    });
});
