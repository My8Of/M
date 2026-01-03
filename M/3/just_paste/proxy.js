/**
 * M/3/just_paste/proxy.js - Gateway Tor para Arch Linux
 */
class ProxyRotator {
  constructor() {
    // No Tor local, o protocolo é socks5h (o 'h' faz o DNS resolver via Tor)
    this.config = {
      host: "127.0.0.1",
      port: 9050,
      protocol: "socks5h",
    };
  }

  async getNext() {
    // Log para auditoria do sniffer
    console.log(
      `[Proxy][Tor] Túnel ativo em ${this.config.host}:${this.config.port}`,
    );
    return this.config;
  }

  async refresh() {
    // O Tor muda o circuito automaticamente, mas podemos forçar no futuro
    console.log("[Proxy] Conectado à rede Tor.");
  }
}

module.exports = new ProxyRotator();
