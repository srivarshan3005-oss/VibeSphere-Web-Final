-- VibeSphere schema update v2: comments table + query indexes.  ADDITIVE and SAFE TO RE-RUN.
--
-- When do I need this?  Normally never in local development: with spring.jpa.hibernate.ddl-auto=update the backend
-- creates `comments` (and its two indexes) by itself on first start. Use this script when you manage the schema
-- by hand or run with ddl-auto=none/validate.  Run it AFTER the backend has started once (so users/posts/... exist):
--
--   mysql -uroot -p vibesphere_db < migration-v2-comments-indexes.sql
--
-- Guarantees: never drops, alters or deletes existing data; every statement checks first, so running it twice
-- (or after Hibernate already created the table) does nothing the second time.
-- Take a backup first if the data matters:  mysqldump -uroot -p vibesphere_db > backup.sql

CREATE TABLE IF NOT EXISTS comments (
  id          BIGINT        NOT NULL AUTO_INCREMENT,
  post_id     BIGINT        NOT NULL,
  parent_id   BIGINT        NULL,
  user_id     BIGINT        NOT NULL,
  body        VARCHAR(1000) NOT NULL,
  created_at  DATETIME(6)   NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

DROP PROCEDURE IF EXISTS vs_add_index;
DELIMITER //
CREATE PROCEDURE vs_add_index(IN tbl VARCHAR(64), IN idx VARCHAR(64), IN cols VARCHAR(200))
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = tbl)
     AND NOT EXISTS (SELECT 1 FROM information_schema.statistics
                     WHERE table_schema = DATABASE() AND table_name = tbl AND index_name = idx) THEN
    SET @vs_sql = CONCAT('CREATE INDEX ', idx, ' ON ', tbl, ' (', cols, ')');
    PREPARE vs_stmt FROM @vs_sql;
    EXECUTE vs_stmt;
    DEALLOCATE PREPARE vs_stmt;
  END IF;
END//
DELIMITER ;

CALL vs_add_index('comments',   'idx_comments_post_created',     'post_id, created_at');
CALL vs_add_index('comments',   'idx_comments_parent',           'parent_id');
CALL vs_add_index('posts',      'idx_posts_visibility_created',  'visibility, created_at');
CALL vs_add_index('posts',      'idx_posts_user_created',        'user_id, created_at');
CALL vs_add_index('post_likes', 'idx_post_likes_post',           'post_id');
CALL vs_add_index('stories',    'idx_stories_expires',           'expires_at');
CALL vs_add_index('follows',    'idx_follows_followed',          'followed_id');

DROP PROCEDURE vs_add_index;
