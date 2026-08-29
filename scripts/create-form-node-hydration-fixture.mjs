import '@angular/compiler';
import { resolve } from 'node:path';
import { Component } from '@angular/core';
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';

const workspace = process.cwd();
const packageUrl = pathToFileURL(resolve(workspace, 'dist', 'fesm2022', 'gem-ng-forms.mjs')).href;
const { field, required, FormNodeDirective } = await import(packageUrl);

class HydrationApp {
  age = field(23, [required], { nullable: false });
}

Component({
  selector: 'form-node-hydration-app',
  standalone: true,
  imports: [FormNodeDirective],
  template: '<input data-age type="text" [formNode]="age"><span data-value>{{ age() }}</span>',
})(HydrationApp);

const hydrationHtml = await renderApplication(
  (context) => bootstrapApplication(HydrationApp, {
    providers: [provideServerRendering(), provideClientHydration()],
  }, context),
  { document: '<form-node-hydration-app></form-node-hydration-app>', url: '/' },
);

const fixtureDirectory = resolve(workspace, 'node_modules', '.cache', 'ng-forms');
mkdirSync(fixtureDirectory, { recursive: true });
writeFileSync(resolve(fixtureDirectory, 'form-node-hydration.html'), hydrationHtml);
