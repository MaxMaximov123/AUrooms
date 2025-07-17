import Vue from 'vue';

Vue.use({
  install(Vue) {
    Vue.socket = {
      connection: null,
      isConnecting: false,
      isConnected: false,
      isAuthorized: false,
      listeners: [],
    };

    Vue.socket.connect = async function () {
      console.log('[socket] Connecting...');
      Vue.socket.connection = new WebSocket(process.env.VUE_APP_WEBSOCKET_URL || `wss://${location.host}/ws`);
      Vue.socket.isConnecting = true;

      Vue.socket.connection.onopen = async () => {
        console.log('[socket] Connected.');
        Vue.socket.isConnecting = false;
        Vue.socket.isConnected = true;

        setTimeout(() => {
          Vue.socket.authorize().catch(console.error);
        }, 1000);
      };

      Vue.socket.connection.onmessage = (event) => {
        let message = null;

        try {
          message = ((type = null, data = null, id = null, relatedId = null, error = null) => {
            return {
              type,
              data,
              id,
              relatedId,
              error,
            };
          })(...JSON.parse(event.data));
        } catch (error) {
          console.error(error);
          return;
        }

        console.debug('[socket] <', message);

        if (message.error) {
          console.error(`[socket] <`, message.error);
          return;
        }

        if (message.type === 'authorized') {
          console.log('[socket] Authorized.');
          Vue.socket.isAuthorized = true;
        }

        for (let listener of Vue.socket.listeners) {
          let messageTypeMatch = message.type.match(listener.messageTypeRegExp);

          if (messageTypeMatch) {
            listener.callback({
              ...message,
              typeMatch: messageTypeMatch,
            });
          }
        }
      };

      Vue.socket.connection.onclose = (event) => {
        console.log('[socket] Connection closed, reconnecting...', event);
        Vue.socket.isConnected = false;
        Vue.socket.isConnecting = true;
        Vue.socket.isAuthorized = false;
        setTimeout(Vue.socket.connect, 1000);
      };
    };

    Vue.socket.send = function (message) {
      let { type = null, data = null, id = null, relatedId = null, error = null } = message;

      let params = [type, data, id, relatedId, error];

      params = params.reduceRight((params, param) => {
        if (param !== null || params.length > 0) {
          params.unshift(param);
        }

        return params;
      }, []);

      message = JSON.stringify(params);
      console.debug('[socket] >', message);
      Vue.socket.isConnected && Vue.socket.connection.send(message);
    };

    Vue.socket.authorize = async function () {
      console.log('[socket] Authorizing...');
      // let response = await $axios.get('auth/socket/token');

      Vue.socket.send({
        type: 'authorize',
        data: {
          apiKey: 'KqUbBFbuf2RvtREdSgE4K8B3WWPRUkGe',
          // sendDetailSnapshot: true,
          // bookieKeys: null,
          // minBookies: 1,
          // sendNormalizedDetails: window.isDemoMode,
        },
      });
    };

    Vue.socket.unauthorize = async function () {
      console.log('[socket] Unauthorizing...');

      Vue.socket.send({
        type: 'unauthorize',
      });
    };

    Vue.socket.on = function (messageTypeRegExp, callback) {
      if (!callback) {
        return;
      }

      Vue.socket.listeners.push({ binding: this, messageTypeRegExp, callback });
    };

    Vue.socket.off = function (messageTypeRegExp, callback) {
      Vue.socket.listeners = Vue.socket.listeners.filter((currentListener) => {
        if (currentListener.binding !== this) {
          return true;
        }

        if (!messageTypeRegExp) {
          return false;
        }

        if (currentListener.messageTypeRegExp.toString() !== messageTypeRegExp.toString()) {
          return true;
        }

        if (!callback) {
          return false;
        }

        if (currentListener.callback === callback) {
          return true;
        }

        return false;
      });
    };

    Vue.prototype.$socket = function () {
      let vm = this;

      return ['connect', 'authorize', 'unauthorize', 'isAuthorized', 'send', 'on', 'off'].reduce(
        (socket, methodName) => {
          socket[methodName] = function () {
            if (typeof Vue.socket[methodName] === 'function') {
              return Vue.socket[methodName].apply(vm, arguments);
            }

            return Vue.socket[methodName];
          };

          return socket;
        },
        {}
      );
    };

    Vue.socket.connect();
  },
});
