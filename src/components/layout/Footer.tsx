import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-4 py-8 text-sm text-muted-foreground md:flex-row md:justify-between">
        <p>© {year} Way. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/feed.xml" className="hover:text-primary transition-colors">
            RSS
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

