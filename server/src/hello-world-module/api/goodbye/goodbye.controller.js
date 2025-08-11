export class GoodbyeController {
  constructor(service) {
    this.service = service;
  }

  getGoodbye(_req, res) {
    res.json(this.service.getGoodbyeMessage());
  }
}
