import { readdir, stat } from 'fs/promises';
import { glob as globCallback, sync as globSync } from 'glob';
import { extname, join } from 'path';
import { promisify } from 'util';
import type { BrowserController } from './browser';

interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified_time: string;
  is_hidden: boolean;
  extension?: string;
}

interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

const glob = promisify(globCallback);

export class FilesystemController {
  constructor(private browserController: BrowserController) {}

  async listDirectory({
    path,
    include_hidden = false,
    pattern,
  }: {
    path: string;
    include_hidden?: boolean;
    pattern?: string;
  }): Promise<Response> {
    try {
      const entries = await readdir(path);
      const fileInfos: FileInfo[] = [];

      for (const entry of entries) {
        if (!include_hidden && entry.startsWith('.')) continue;

        const fullPath = join(path, entry);
        const stats = await stat(fullPath);
        const info: FileInfo = {
          name: entry,
          path: fullPath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified_time: stats.mtime.toISOString(),
          is_hidden: entry.startsWith('.'),
          extension: stats.isFile() ? extname(entry).slice(1) : undefined,
        };

        if (pattern) {
          if (globSync(pattern, { cwd: path }).includes(entry)) {
            fileInfos.push(info);
          }
        } else {
          fileInfos.push(info);
        }
      }

      return new Response(JSON.stringify(fileInfos), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return new Response(JSON.stringify({ error: 'Directory not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async getDirectoryTree({
    path,
    max_depth = 3,
    include_hidden = false,
    pattern,
  }: {
    path: string;
    max_depth?: number;
    include_hidden?: boolean;
    pattern?: string;
  }): Promise<Response> {
    try {
      const buildTree = async (
        currentPath: string,
        depth: number
      ): Promise<TreeNode> => {
        const stats = await stat(currentPath);
        const name = currentPath.split('/').pop()!;

        if (stats.isFile()) {
          return { name, type: 'file' };
        }

        if (depth >= max_depth) {
          return { name, type: 'directory' };
        }

        const entries = await readdir(currentPath);
        const children: TreeNode[] = [];

        for (const entry of entries) {
          if (!include_hidden && entry.startsWith('.')) continue;

          const fullPath = join(currentPath, entry);
          if (
            pattern &&
            !globSync(pattern, { cwd: currentPath }).includes(entry)
          )
            continue;

          children.push(await buildTree(fullPath, depth + 1));
        }

        return {
          name,
          type: 'directory',
          children,
        };
      };

      const tree = await buildTree(path, 0);
      return new Response(JSON.stringify(tree), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return new Response(JSON.stringify({ error: 'Directory not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async searchFiles({
    root_path,
    pattern,
    max_results = 100,
    include_hidden = false,
  }: {
    root_path: string;
    pattern: string;
    max_results?: number;
    include_hidden?: boolean;
  }): Promise<Response> {
    try {
      const matches = await glob(pattern, {
        cwd: root_path,
        dot: include_hidden,
        absolute: true,
        nodir: true,
      }).then((results) => (results as string[]).slice(0, max_results));

      const fileInfos = await Promise.all(
        matches.map(async (match) => {
          const stats = await stat(match);
          return {
            name: match.split('/').pop()!,
            path: match,
            type: 'file',
            size: stats.size,
            modified_time: stats.mtime.toISOString(),
            is_hidden: match.split('/').pop()!.startsWith('.'),
            extension: extname(match).slice(1),
          };
        })
      );

      return new Response(JSON.stringify(fileInfos), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return new Response(
          JSON.stringify({ error: 'Root directory not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async getPathInfo(path: string): Promise<Response> {
    try {
      const stats = await stat(path);
      const info: FileInfo = {
        name: path.split('/').pop()!,
        path,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified_time: stats.mtime.toISOString(),
        is_hidden: path.split('/').pop()!.startsWith('.'),
        extension: stats.isFile() ? extname(path).slice(1) : undefined,
      };

      return new Response(JSON.stringify(info), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return new Response(JSON.stringify({ error: 'Path not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}
