export class HelloController {
  constructor(service) {
    this.service = service;
  }

  getHello(_req, res) {
    res.json(this.service.getHelloMessage());
  }
}
