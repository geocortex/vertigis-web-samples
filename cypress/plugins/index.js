/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

let browserInfoLogged = false;

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
    // `on` is used to hook into various events Cypress emits
    // `config` is the resolved Cypress config
    on("before:browser:launch", (browser = {}, launchOptions) => {
        if (browser.family === "chromium" && browser.name !== "electron") {
            // Remove default `disable-gpu` flag.
            launchOptions.args = launchOptions.args.filter(
                (arg) => arg !== "--disable-gpu"
            );
            // Coerce Chrome into enabling GPU accel as it often will default to
            // software only on Linux systems.
            launchOptions.args.push("--ignore-gpu-blacklist");
        }

        if (!browserInfoLogged) {
            console.log("Browser information:");
            console.log(browser);
            console.log("Browser launch options:");
            console.log(launchOptions.args);
            browserInfoLogged = true;
        }

        return launchOptions;
    });
};
