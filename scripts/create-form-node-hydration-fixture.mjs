import '@angular/compiler';
import { resolve } from 'node:path';
import { Component } from '@angular/core';
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';

const workspace = process.cwd();
const packageUrl = pathToFileURL(resolve(workspace, 'dist', 'fesm2022', 'form-nodes.mjs')).href;
const signalControlUrl = pathToFileURL(resolve(workspace, 'node_modules', '.cache', 'form-nodes', 'aot-signal-control', 'form-node-signal-control.fixture.mjs')).href;
const { field, required, FormNode } = await import(packageUrl);
const { AotSignalControlHost } = await import(signalControlUrl);

class HydrationApp {
  age = field.strict(23, [required]);
}

Component({
  selector: 'form-node-hydration-app',
  standalone: true,
  imports: [FormNode],
  template: '<input data-age type="text" [formNode]="age"><span data-value>{{ age() }}</span>',
})(HydrationApp);

const hydrationHtml = await renderApplication(
  (context) => bootstrapApplication(HydrationApp, {
    providers: [provideServerRendering(), provideClientHydration()],
  }, context),
  { document: '<form-node-hydration-app></form-node-hydration-app>', url: '/' },
);

const signalControlHydrationHtml = await renderApplication(
  (context) => bootstrapApplication(AotSignalControlHost, {
    providers: [provideServerRendering(), provideClientHydration()],
  }, context),
  { document: '<aot-signal-control-host></aot-signal-control-host>', url: '/' },
);

const fixtureDirectory = resolve(workspace, 'node_modules', '.cache', 'form-nodes');
mkdirSync(fixtureDirectory, { recursive: true });
writeFileSync(resolve(fixtureDirectory, 'form-node-hydration.html'), hydrationHtml);
writeFileSync(resolve(fixtureDirectory, 'form-node-signal-control-hydration.html'), signalControlHydrationHtml);
