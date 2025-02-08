/// <reference types="vitest" />
import puppeteer from 'puppeteer';
import { Browser } from 'puppeteer';
import type { TestProject } from 'vitest/node';

let browser: Browser;

async function setup(project: TestProject) {
  browser = await puppeteer.launch();
  project.provide('browserWsEndpoint', browser.wsEndpoint());
}

async function teardown() {
  await browser.close();
}

declare module 'vitest' {
  export interface ProvidedContext {
    browserWsEndpoint: string;
  }
}

export { setup, teardown };
