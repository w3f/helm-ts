import * as fs from 'fs-extra';
import { should } from 'chai';
import * as path from 'path';
import * as tmp from 'tmp';
import * as yaml from 'js-yaml';
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
let subjectFromFactory: Helm;
let kind: Kind;
let k8sApi: k8s.CoreV1Api;

let currentRelease = '';
let currentNamespace = '';

const localChart = path.join(__dirname, 'charts', 'test');

let kubeconfig: string;

async function checkLocalInstall(subject: Helm, name: string): Promise<void> {
    const chartCfg: ChartConfig = {
        name,
        chart: localChart,
        wait: true
    };

    await subject.install(chartCfg);

    const pods = await k8sApi.listNamespacedPod('default', undefined, undefined, undefined, undefined, `release=${name}`);
    pods.body.items.length.should.eq(2);
}

async function checkRemoteInstall(subject: Helm, name: string, version?: string): Promise<void> {
    const repos = [{
        name: 'bitnami',
        url: 'https://charts.bitnami.com/bitnami'
    }];
    await subject.addRepos(repos);

    const chart = 'bitnami/redis';
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

async function checkInstallWithValues(subject: Helm, name: string): Promise<void> {
    const replicas = 5;

    const values = { replicas };

    const chartCfg: ChartConfig = {
        name,
        chart: localChart,
        wait: true,
        values
    };

    await subject.install(chartCfg);

    const pods = await k8sApi.listNamespacedPod('default', undefined, undefined, undefined, undefined, `release=${name}`);
    pods.body.items.length.should.eq(+replicas);
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

    describe('constructor', () => {
        describe('install/uninstall', () => {
            afterEach(async () => {
                await subject.uninstall(currentRelease, currentNamespace);
            });
            it('should install/uninstall a local chart', async () => {
                const name = 'test-constructor-local';

                currentRelease = name;

                await checkLocalInstall(subject, name);
            });
            it('should install a remote chart', async () => {
                const name = 'test-constructor-remote';

                currentRelease = name;

                await checkRemoteInstall(subject, name);
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

                const name = 'test-constructor-namespace';

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
                const name = 'test-constructor-values';

                currentRelease = name;

                await checkInstallWithValues(subject, name);
            });
            it('should install a chart version', async () => {
                const name = 'test-constructor-version';

                currentRelease = name;

                await checkRemoteInstall(subject, name, '10.6.5');
            });
        });
        describe('template', () => {
            it('should return the templated resources as a string', async () => {
                const name = 'test-template';

                const chartCfg: ChartConfig = {
                    name,
                    chart: localChart
                };

                const result = await subject.template(chartCfg);

                const obj = yaml.safeLoad(result);

                obj.metadata.labels.release.should.eq(name);
            });
        });
    });

    describe('static factory, kubeconfig and logger params', () => {
        before(async () => {
            subjectFromFactory = await Helm.create(kubeconfig, logger);

            subjectFromFactory.should.exist;
        });
        afterEach(async () => {
            await subjectFromFactory.uninstall(currentRelease, currentNamespace);
        });

        it('should allow to install local charts', async () => {
            const name = 'test-factory-kc-logger-local';

            currentRelease = name;

            await checkLocalInstall(subjectFromFactory, name);
        });
        it('should allow to pass values', async () => {
            const name = 'test-factory-kc-logger-values';

            currentRelease = name;

            await checkInstallWithValues(subjectFromFactory, name);
        });
    });

    describe('static factory, no params', () => {
        before(async () => {
            subjectFromFactory = await Helm.createBare();

            subjectFromFactory.setKubeconfig(kubeconfig);

            subjectFromFactory.should.exist;
        });
        afterEach(async () => {
            await subjectFromFactory.uninstall(currentRelease, currentNamespace);
        });

        it('should allow to install local charts', async () => {
            const name = 'test-factory-no-params-local';

            currentRelease = name;

            await checkLocalInstall(subjectFromFactory, name);
        });
        it('should allow to pass values', async () => {
            const name = 'test-factory-no-params-values';

            currentRelease = name;

            await checkInstallWithValues(subjectFromFactory, name);
        });
    });
});
