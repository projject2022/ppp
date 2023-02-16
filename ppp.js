/** @decorator */

import { observable, html } from './vendor/fast-element.min.js';
import { DesignToken } from './design/design-token.js';
import { KeyVault } from './lib/key-vault.js';
import { bufferToString, generateIV, PPPCrypto } from './lib/ppp-crypto.js';
import { PPPElement } from './lib/ppp-element.js';
import { APIS, TRADERS } from './lib/const.js';

(class DesignSystemCanvas extends PPPElement {
  connectedCallback() {
    super.connectedCallback();

    DesignToken.registerDefaultStyleTarget(this);
  }
}
  .compose({
    template: html` <slot></slot> `
  })
  .define());

class PPP {
  @observable
  workspaces;

  @observable
  extensions;

  @observable
  settings;

  @observable
  darkMode;

  locales = ['ru'];

  locale =
    localStorage.getItem('ppp-locale') ??
    this.locales.find((l) => {
      return new RegExp(`^${l}\\b`, 'i').test(navigator.language);
    }) ??
    this.locales[0];

  crypto = new PPPCrypto();

  traders = new Map();

  constructor(appType) {
    globalThis.ppp = this;

    this.workspaces = [];
    this.extensions = [];
    this.settings = {};

    this.designSystemCanvas = document.querySelector(
      'ppp-design-system-canvas'
    );

    this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const savedDarkMode = localStorage.getItem('ppp-dark-mode');

    if (typeof savedDarkMode === 'string') {
      if (savedDarkMode === '0') this.darkMode = false;
      else if (savedDarkMode === '1') this.darkMode = true;
      else localStorage.setItem('ppp-dark-mode', '2');
    } else {
      localStorage.setItem('ppp-dark-mode', '2');
    }

    this.appType = appType;
    this.rootUrl = window.location.origin;

    if (this.rootUrl.endsWith('.github.io')) this.rootUrl += '/ppp';

    void this.start();
  }

  structuredClone(value) {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    } else {
      return JSON.parse(JSON.stringify(value));
    }
  }

  #showLoadingError({ errorText, shouldShowServiceMachineInput }) {
    document.querySelector('.splashscreen-loader').classList.add('error');
    document.querySelector('.loading-text').classList.add('error');

    document.querySelector('.loading-text').textContent = errorText;

    if (shouldShowServiceMachineInput) {
      document.querySelector('.service-machine-url').removeAttribute('hidden');
    }
  }

  async #rebuildDictionary() {
    this.dict = new Polyglot({
      locale: this.locale
    });

    (await import(`./i18n/${this.locale}/loading-errors.i18n.js`)).default(
      this.dict
    );
  }

  async #createApplication({ emergency }) {
    if (!emergency) {
      const { getApp, Credentials } = await import('./lib/realm.js');

      try {
        this.realm = getApp(this.keyVault.getKey('mongo-app-client-id'));
        this.credentials = Credentials.apiKey(
          this.keyVault.getKey('mongo-api-key')
        );
        this.user = await this.realm.logIn(this.credentials, false);
      } catch (e) {
        console.error(e);

        if (e.statusCode === 401 || e.statusCode === 404) {
          this.keyVault.removeKey('mongo-api-key');

          return this.#createApplication({ emergency: true });
        } else {
          if (/Failed to fetch/i.test(e?.message)) {
            this.#showLoadingError({
              errorText: this.t('$loadingErrors.E_NO_SM_CONNECTION'),
              shouldShowServiceMachineInput: true
            });
          } else {
            this.#showLoadingError({
              errorText: this.t('$loadingErrors.E_UNKNOWN')
            });
          }

          return;
        }
      }
    } else {
      const params = Object.fromEntries(
        new URLSearchParams(window.location.search).entries()
      );

      if (params.page !== 'cloud-services') {
        window.history.replaceState(
          '',
          '',
          `${window.location.origin}${window.location.pathname}?page=cloud-services`
        );
      }
    }

    if (!emergency) {
      try {
        const lines = ((context) => {
          const db = context.services.get('mongodb-atlas').db('ppp');

          const workspaces = db
            .collection('workspaces')
            .find({ removed: { $not: { $eq: true } } }, { _id: 1, name: 1 });

          const settings = db.collection('app').findOne({ _id: '@settings' });

          const extensions = db
            .collection('extensions')
            .find({ removed: { $not: { $eq: true } } });

          return { workspaces, settings, extensions };
        })
          .toString()
          .split(/\r?\n/);

        lines.pop();
        lines.shift();

        const evalRequest = await this.user.functions.eval(lines.join('\n'));

        this.workspaces = evalRequest.workspaces ?? [];
        this.extensions = evalRequest.extensions ?? [];
        this.settings = evalRequest.settings ?? {};

        const storedDarkMode = this.settings.darkMode;

        if (storedDarkMode === '1') {
          this.darkMode = true;

          localStorage.setItem('ppp-dark-mode', '1');
        } else if (storedDarkMode === '0') {
          this.darkMode = false;

          localStorage.setItem('ppp-dark-mode', '0');
        } else if (storedDarkMode === '2') {
          this.darkMode = window.matchMedia(
            '(prefers-color-scheme: dark)'
          ).matches;

          localStorage.setItem('ppp-dark-mode', '2');
        }

        if (this.locales.indexOf(this.settings.locale) > -1) {
          this.locale = this.settings.locale;
        }

        await this.#rebuildDictionary();

        localStorage.setItem('ppp-locale', this.locale);
      } catch (e) {
        console.error(e);

        if (/Failed to fetch/i.test(e?.message)) {
          this.#showLoadingError({
            errorText: this.t('$loadingErrors.E_NO_SM_CONNECTION'),
            shouldShowServiceMachineInput: true
          });
        } else if (/failed to find refresh token/i.test(e?.message)) {
          sessionStorage.removeItem('realmLogin');
          window.location.reload();
        } else if (/Cannot access member 'db' of undefined/i.test(e?.message)) {
          this.#showLoadingError({
            errorText: this.t('$loadingErrors.E_BROKEN_ATLAS_REALM_LINK')
          });
        } else if (
          /error resolving cluster hostname/i.test(e?.message) ||
          /error connecting to MongoDB cluster/i.test(e?.message) ||
          /server selection error/i.test(e?.message)
        ) {
          this.#showLoadingError({
            errorText: this.t('$loadingErrors.E_OFFLINE_REALM')
          });
        } else if (/function not found: 'eval'/i.test(e?.message)) {
          this.#showLoadingError({
            errorText: this.t(
              '$loadingErrors.E_CLOUD_SERVICES_MISCONFIGURATION_PLEASE_WAIT'
            )
          });

          setTimeout(() => {
            localStorage.removeItem('ppp-mongo-app-id');
            localStorage.removeItem('ppp-tag');

            window.location.reload();
          }, 5000);
        } else {
          this.#showLoadingError({
            errorText: this.t('$loadingErrors.E_UNKNOWN')
          });
        }

        return;
      }
    }

    try {
      await import(`./elements/app.js`);

      const appElement = document.createElement('ppp-app');

      this.app = this.designSystemCanvas.appendChild(appElement);

      document
        .querySelector('.splashscreen-loader')
        .setAttribute('hidden', true);
    } catch (e) {
      console.error(e);

      this.#showLoadingError({
        errorText: this.t('$loadingErrors.E_UNKNOWN')
      });
    }
  }

  async i18n(url) {
    const fileName = url
      .substring(url.lastIndexOf('/') + 1)
      .replace('.', '.i18n.');

    (await import(`./i18n/${this.locale}/${fileName}`)).default(this.dict);
  }

  t(key, options) {
    return this.dict.t(key, options);
  }

  async start() {
    await this.#rebuildDictionary();

    this.keyVault = new KeyVault();

    if (!this.keyVault.ok()) {
      return this.#createApplication({ emergency: true });
    } else {
      return this.#createApplication({});
    }
  }

  async encrypt(document = {}) {
    const clone = this.structuredClone(document);

    let iv;

    for (const key in clone) {
      if (
        /(token|key|secret|password)$/i.test(key) &&
        !(key === 'key' && clone?.type === APIS.PUSHER)
      ) {
        if (!iv) {
          iv = generateIV();
        }

        clone[key] = await this.crypto.encrypt(iv, clone[key]);
        clone.iv = bufferToString(iv);
      }
    }

    return clone;
  }

  async decrypt(document = {}) {
    const clone = this.structuredClone(document);

    for (const key in clone) {
      if (
        /(token|key|secret|password)$/i.test(key) &&
        !(key === 'key' && clone?.type === APIS.PUSHER)
      ) {
        try {
          clone[key] = await this.crypto.decrypt(document.iv, clone[key]);
        } catch (e) {
          if (!(key === 'key' && clone?.type === APIS.PUSHER)) {
            throw e;
          }
        }
      } else if (
        clone[key] !== null &&
        typeof clone[key] === 'object' &&
        clone[key].iv
      ) {
        clone[key] = await this.decrypt(clone[key]);
      }
    }

    return clone;
  }

  decryptDocumentsTransformation() {
    return async (d) => {
      if (Array.isArray(d)) {
        const mapped = [];

        for (const document of d) {
          mapped.push(await this.decrypt(document));
        }

        return mapped;
      }

      return d;
    };
  }

  async getOrCreateTrader(document) {
    if (document) {
      const module = await import(
        {
          [TRADERS.ALOR_OPENAPI_V2]: `${this.rootUrl}/traders/alor-openapi-v2.js`,
          [TRADERS.TINKOFF_GRPC_WEB]: `${this.rootUrl}/traders/tinkoff-grpc-web.js`,
          [TRADERS.ALPACA_V2_PLUS]: `${this.rootUrl}/traders/alpaca-v2-plus.js`,
          [TRADERS.BINANCE_V3]: `${this.rootUrl}/traders/binance-v3.js`,
          [TRADERS.CUSTOM]: document.url
        }[document.type]
      );

      if (!this.traders.has(document._id)) {
        this.traders.set(document._id, new module.default(document));
      }

      return this.traders.get(document._id);
    }
  }

  async getOrCreatePusherConnection(document) {
    if (document) {
      await import(`${ppp.rootUrl}/vendor/pusher.min.js`);

      Pusher.logToConsole = false;

      if (!this.traders.has(document._id)) {
        this.traders.set(
          document._id,
          new Pusher(document.key, {
            cluster: document.cluster,
            enabledTransports: ['ws', 'wss'],
            disabledTransports: ['xhr_streaming', 'xhr_polling', 'sockjs']
          })
        );

        this.traders.get(document._id).subscribe('telegram');
        this.traders.get(document._id).subscribe('ppp');
      }

      return this.traders.get(document._id);
    }
  }
}

export default new PPP(document.documentElement.getAttribute('ppp-app-type'));
