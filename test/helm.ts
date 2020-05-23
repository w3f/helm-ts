import fs from 'fs-extra';
import { should } from 'chai';
import path from 'path';
import tmp from 'tmp';
import { Components } from '@w3f/components';
import { Cmd } from '@w3f/cmd';

import { Helm } from '../src/index';
import {
    LoggerMock,
    TplMock
} from './mocks';

const logger = new LoggerMock();
const tpl = new TplMock();

const cmCfg = {
    'helm': 'https://w3f.github.io/components-ts/downloads/linux-amd64/helm/3.2.1/helm.tar.gz',
    'kind': 'https://w3f.github.io/components-ts/downloads/linux-amd64/kind/0.8.1/kind.tar.gz'
};
const cm = new Components('helm-test', cmCfg, logger);
const cmd = new Cmd(logger);

let subject: Helm;

should();

describe('Helm', () => {
    before(async () => {
        const helmPath = await cm.path('helm');
        const kindPath = await cm.path('kind');

        subject = new Helm(helmPath, cmd, tpl, logger);
    });

    describe('install', () => {
        it('should install a local chart');
        it('should install a remote chart from stable');
        it('should install a remote chart from a custom repo');
        it('should allow to pass values');
    });
    describe('uninstall', () => {
        it('should uninstall charts');
    });
});
