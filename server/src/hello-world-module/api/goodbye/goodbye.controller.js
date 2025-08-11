export class GoodbyeController {
  constructor(service) {
    this.service = service;
  }

  getGoodbye(_req, res) {
    res.send(this.service.getGoodbyeMessage());
  }
}
