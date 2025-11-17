import type { Request, Response } from "express";
import * as UsersRepository from "./repository.js";
import { WebPush } from "../../lib/webpush.js";
import { UserCookie } from "../../lib/auth.js";
import type { UserDto, UserEntity } from "../../models.js";
// import { UAParser as UserAgentParser } from "ua-parser-js";

const toUserAgent = (ua: string | string[] | undefined): string | null => {
  return Array.isArray(ua) ? ua.toString() : ua || null;
};

const toUserDto = (id: string, username: string) => ({
  id,
  username,
  tag: `#${id.slice(0, 4)}`,
});

export const registerUser = async (req: Request, res: Response) => {
  const id = UserCookie.getUserId(req);

  if (id) {
    const user = await UsersRepository.getUserById(id);

    if (user) {
      // Already registered. Throw an error?

      if (user.subscription) {
        // Todo: Change Welcome Back message to middleware on `/` entry.
        const payload = JSON.stringify({
          title: `Welcome back ${user.username} 😊`,
        });
        WebPush.send(user.subscription, payload);
      }

      res.status(400).send("Already registered.");
      return;
    }
  }

  // // Todo: Get device & OS information. Some dashboard for summary?.
  // console.log(UserAgentParser(req.headers["user-agent"]).ua);

  const username = req.body.username;
  const userAgent = toUserAgent(req.headers["user-agent"]);

  const generatedId = await UsersRepository.registerGuestUser(
    username,
    userAgent
  );

  UserCookie.setUserId(res, generatedId);
  res.status(201).json(toUserDto(generatedId, username));
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const id = UserCookie.getUserId(req);

  if (!id) {
    res.sendStatus(401);
    return;
  }

  const user = await UsersRepository.getUserById(id);

  if (!user) {
    res.sendStatus(404);
    return;
  }

  if (user.subscription) {
    const payload = JSON.stringify({
      title: `Welcome back ${user.username} 😊`,
    });
    WebPush.send(user.subscription, payload);
  }

  UserCookie.setUserId(res, id);
  res.json(toUserDto(user.id, user.username));
};

// Debug only?
export const logoutUser = async (req: Request, res: Response) => {
  res.clearCookie("u");
  res.sendStatus(204);
};

// Todo: Get Username from frontend to identify the user and display in list to push.

const toDto = (user: UserEntity): UserDto => ({
  id: user.id,
  username: user.username,
  subscribed: Boolean(user.subscription),
  createdAt: user.created_at,
});

export const getAllUsers = async (req: Request, res: Response) => {
  const allUsers = await UsersRepository.getAllUsers();

  const users = allUsers.map(toDto);

  res.json(users);
};

export const getAllSubscribedUsers = async (req: Request, res: Response) => {
  const allSubscribedUsers = await UsersRepository.getAllSubscribedUsers();

  const users = allSubscribedUsers.map(toDto);

  res.json(users);
};
