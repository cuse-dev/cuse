import { computerService } from '@repo/services';
import { NextResponse } from 'next/server';

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ name: string; path: string[] }> }
) => {
  const { name, path } = await params;

  const computer = await computerService.getByName(name);
  let url = computer.url;
  if (!url) {
    await computerService.start(computer.id);
    url = computer.url;
  }

  const searchParams = req.url.split('?')[1];

  if (!url) {
    return NextResponse.json(
      { error: 'Computer not started' },
      { status: 500 }
    );
  }

  return fetch(
    `${url}/${path.join('/')}${searchParams ? `?${searchParams}` : ''}`,
    req
  );
};
