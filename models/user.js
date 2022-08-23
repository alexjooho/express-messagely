"use strict";

const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const { UnauthorizedError, NotFoundError } = require("../expressError");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {

    const hashed = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)  // don't forget to await!
    const results = await db.query(`INSERT INTO users (username,
                                                        password,
                                                        first_name,
                                                        last_name,
                                                        phone,
                                                        join_at,
                                                        last_login_at)
                                      VALUES
                                      ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
                                      RETURNING username, password, first_name, last_name, phone`,
      [username, hashed, first_name, last_name, phone]);

    return results.rows[0];
    //TODO: why do we want to return the hashed password?
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const results = await db.query(`SELECT password
                                  FROM users
                                  WHERE username = $1`,
                                  [username]);
    const user = results.rows[0];
    
    if(user) {
      if(await bcrypt.compare(password, user.password) === true) {
        return true;
      }
    }
    return false;
    
    // return user && await bcrypt.compare(password, user.password) === true;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const results = await db.query(
      `UPDATE users
      SET last_login_at = current_timestamp
      WHERE username = $1
      RETURNING username`,
      [username]
    );
    const user = results.rows[0];
    if(!user) {
      throw new NotFoundError(`User ${username} not found`)
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(`SELECT username, first_name, last_name
                                  FROM users`);
    
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(`SELECT username,
                                          first_name,
                                          last_name,
                                          phone,
                                          join_at,
                                          last_login_at
                                    FROM users
                                    WHERE username = $1`,
                                    [username]);
    
    const user = results.rows[0];
    if(!user) {
      throw new NotFoundError(`User ${username} not found`)
    }
    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(`SELECT m.id,
                                            t.username,
                                            t.first_name,
                                            t.last_name,
                                            t.phone,
                                            m.body,
                                            m.sent_at,
                                            m.read_at
                                    FROM users as u
                                        JOIN messages AS m ON m.from_username = u.username
                                        JOIN users AS t ON m.to_username = t.username
                                    WHERE u.username = $1`,
                                    [username]);
                                    
    return results.rows.map(m => ({
      id: m.id,
      to_user: {
        username: m.username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
    }));
    
  }
  //TODO: why do we not have to do a fail check?

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(`SELECT m.id,
                                            f.username,
                                            f.first_name,
                                            f.last_name,
                                            f.phone,
                                            m.body,
                                            m.sent_at,
                                            m.read_at
                                    FROM users as u
                                        JOIN messages AS m ON m.to_username = u.username
                                        JOIN users AS f ON m.from_username = f.username
                                    WHERE u.username = $1`,
                                    [username]);
                                    
    return results.rows.map(m => ({
      id: m.id,
      from_user: {
        username: m.username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
    }));
  }
}


module.exports = User;
