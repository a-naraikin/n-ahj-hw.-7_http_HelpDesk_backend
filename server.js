const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const app = new Koa();

function getTime() {
  const date = new Date();
  return (`${String(date.getDate() + 1)
    .padStart(2, '0')}.${String(date.getMonth() + 1)
    .padStart(2, '0')}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`)
}

class Ticket {
  constructor(id, name, description, status, created) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.status = status;
    this.created = created;
  }
}

const ticketsFull = [];

ticketsFull.push(new Ticket(1,'Поменять краску в принтере, ком. 404', 'Принтер HP LJ 1210, картридж на складе', false, '10.03.2019 08:40'));
ticketsFull.push(new Ticket(2,'Переустановить Windows, ПК-Hall24', '', false, '15.03.2019 12:35'));
ticketsFull.push(new Ticket(3,'Установить обновление КВ-ХХХ', 'Вышло критическое обновление для Windows, нужно поставить обновления в следующем приоритете: 1. Сервера (не забыть сделать бэкап!) 2. Рабочие станции', true, '15.03.2019 12:40'));

const tickets = ticketsFull.map(({ id, name, status, created }) => ({
  id, name, status, created,
}));

app.use(koaBody({
  urlencoded: true,
  multipart: true,
}));

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }
  const headers = { 'Access-Control-Allow-Origin': '*', };
  
  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({...headers});
    try {
      return await next();
    } catch (e) {
      e.headers = {...e.headers, ...headers};
      throw e;
    }
  }
  
  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });
  
    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }
    ctx.response.status = 204;
  }
});

app.use(async (ctx) => {
  ctx.response.body ='server response';

  const { method, ID } = ctx.request.query;
  const { id, name, description, status } = ctx.request.body;

  let currentId = ticketsFull.length + 1;

  switch (method) {
    case 'allTickets':
      ctx.response.body = tickets;
      return;
    case 'ticketById':
      const ticketFull = ticketsFull.find(item => item.id === +ID);
      ctx.response.body = ticketFull;
      return;
    case 'createTicket':
      const ticket = new Ticket(currentId, name, description, false, getTime())
      ticketsFull.push(ticket);

      ctx.response.body = ticket;
      currentId += 1;
      return;
    case 'statusTicket':
      const ticketStat = ticketsFull.findIndex(item => +id === item.id);
      ticketsFull[ticketStat].status = status;
  
      ctx.response.body = true;
      return;
    case 'changeTicket':
      const ticketIndex = ticketsFull.findIndex(item => +id === item.id);

      ticketsFull[ticketIndex].name = name;
      ticketsFull[ticketIndex].description = description;

      ctx.response.body = ticketsFull[ticketIndex];
      return;
    case 'deleteTicket':
      const ticketDel = ticketsFull.findIndex(item => item.id === +ID);
      ticketsFull.splice(ticketDel, 1);
  
      ctx.response.body = true;
      return;
    default:
      ctx.response.status = 404;
      return;
  }
});

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback()).listen(port);
