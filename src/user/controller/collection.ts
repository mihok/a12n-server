import Controller from '@curveball/controller';
import { Context } from '@curveball/core';
import { Conflict, Forbidden, NotFound, UnprocessableEntity } from '@curveball/http-errors';
import * as privilegeService from '../../privilege/service';
import * as hal from '../formats/hal';
import * as usersService from '../service';
import { UserTypeList } from '../types';

class UserCollectionController extends Controller {

  async get(ctx: Context) {

    const users = await usersService.findAll();
    ctx.response.body = hal.collection(users);

  }

  async post(ctx: Context) {

    if (!await privilegeService.hasPrivilege(ctx, 'admin')) {
      throw new Forbidden('Only users with the "admin" privilege may create new users');
    }

    const userBody = ctx.request.body;

    try {
      await usersService.findByIdentity(userBody._links.me.href);
      throw new Conflict('User already exists');
    } catch (err) {
      if (!(err instanceof NotFound)) {
        throw err;
      }
    }

    if (typeof userBody.nickname !== 'string') {
      throw new UnprocessableEntity('nickname must be a string');
    }

    if (typeof userBody.active !== 'boolean') {
      throw new UnprocessableEntity('active must be a boolean');
    }

    if (!UserTypeList.includes(userBody.type)) {
      throw new UnprocessableEntity('type must be one of ' + UserTypeList.join(', '));
    }

    const user = await usersService.save(
      hal.halToModel(userBody)
    );

    ctx.response.status = 201;
    ctx.response.headers.set('Location', `/user/${user.id}`);
  }

}

export default new UserCollectionController();
