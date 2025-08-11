export class HelloController {
  constructor(service) {
    this.service = service;
  }

  getHello(_req, res) {
    res.send(this.service.getHelloMessage());
  }
}
