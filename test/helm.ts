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

let currentRelease = '';
let currentNamespace = '';

const localChart = path.join(__dirname, 'charts', 'test');
const name = 'test';

let kubeconfig: string;

async function checkLocalInstall(subject: Helm): Promise<void> {
    const chartCfg: ChartConfig = {
        name,
        chart: localChart,
        wait: true
    };

    await subject.install(chartCfg);

    const pods = await k8sApi.listNamespacedPod('default', undefined, undefined, undefined, undefined, `release=${name}`);
    pods.body.items.length.should.eq(2);
}

async function checkRemoteInstall(subject: Helm, version?: string): Promise<void> {
    const repos = [{
        name: 'bitnami',
        url: 'https://charts.bitnami.com/bitnami'
    }];
    await subject.addRepos(repos);

    const chart = 'bitnami/redis';
    const name = 'test-redis';
    currentRelease = name;

    const chartCfg: ChartConfig = {
        name,
        chart,
        wait: true
    };
    if (version) {
        chartCfg.version = version;
    }

    await subject.install(chartCfg);

    const pods = await k8sApi.listNamespacedPod('default', undefined, undefined, undefined, undefined, `release=${name}`);
    pods.body.items.length.should.eq(3);
}

describe('Helm', () => {
    before(async () => {
        const binaryPath = await cm.path('helm');
        const kindPath = await cm.path('kind');

        kind = new Kind(kindPath, cmd, logger);
        await kind.start();

        const kubeconfigContent = await kind.kubeconfig() as string;

        const tmpobj = tmp.fileSync();
        kubeconfig = tmpobj.name;
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

    beforeEach(() => {
        currentNamespace = 'default';
    });

    afterEach(async () => {
        await subject.uninstall(currentRelease, currentNamespace);
    });

    describe('constructor', () => {
        it('should install/uninstall a local chart', async () => {
            currentRelease = name;

            await checkLocalInstall(subject);
        });
        it('should install a remote chart', async () => {
            currentRelease = name;

            await checkRemoteInstall(subject);
        });
        it('should install charts in a namespace', async () => {
            const ns = 'test';

            const nsManifest = {
                apiVersion: 'v1',
                kind: 'Namespace',
                metadata: {
                    name: ns
                }
            }
            await k8sApi.createNamespace(nsManifest);

            currentRelease = name;
            currentNamespace = ns;
            const chartCfg: ChartConfig = {
                name,
                chart: localChart,
                ns,
                wait: true
            };

            await subject.install(chartCfg);

            const pods = await k8sApi.listNamespacedPod(ns, undefined, undefined, undefined, undefined, `release=${name}`);
            pods.body.items.length.should.eq(2);
        });
        it('should allow to pass values', async () => {
            const replicas = 4;

            currentRelease = name;

            const tmpobj = tmp.fileSync();
            const valuesTemplateContent = `replicas: {{ replicas }}`;
            const valuesTemplatePath = tmpobj.name;
            const valuesTemplateData = { replicas };
            fs.writeFileSync(valuesTemplatePath, valuesTemplateContent);

            const valuesTemplate = {
                path: valuesTemplatePath,
                data: valuesTemplateData
            }

            const chartCfg: ChartConfig = {
                name,
                chart: localChart,
                wait: true,
                valuesTemplate
            };

            await subject.install(chartCfg);

            const pods = await k8sApi.listNamespacedPod('default', undefined, undefined, undefined, undefined, `release=${name}`);
            pods.body.items.length.should.eq(+replicas);
        });
        it('should install a chart version', async () => {
            currentRelease = name;

            await checkRemoteInstall(subject, '10.6.5');
        });
    });

    describe('static factory', () => {
        it('allows to create instances', async () => {
            const subjectFromFactory = await Helm.create(kubeconfig, logger);

            subjectFromFactory.should.exist;

            currentRelease = name;

            await checkLocalInstall(subjectFromFactory);
        });
    });
});
