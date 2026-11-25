import { Link } from "react-router-dom";
import { ArrowRight } from "../components/Icons";
import { PrintImage } from "../components/ui/PrintImage";
import { useCatalogue } from "../lib/catalogue";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export function NotFound() {
  const { sessions } = useCatalogue();
  useDocumentTitle("Page not found — W4L Studios");
  return (
    <section className="bg-wall">
      <div className="wrap grid min-h-[70vh] items-center gap-10 py-16 md:grid-cols-2">
        <div>
          <p className="kicker">404 · Frame not found</p>
          <h1 className="page-title mt-4">This one never made the edit.</h1>
          <p className="mt-5 max-w-md font-serif text-[17px] leading-relaxed text-ink/75">
            The page you were walking towards is not here. The gallery is still open, and the sessions are where they
            should be.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/" className="btn btn-lime">
              Back to the gallery <ArrowRight size={15} />
            </Link>
            <Link to="/sessions" className="btn">
              See sessions
            </Link>
          </div>
        </div>
        {sessions[0] && (
          <Link to={`/sessions/${sessions[0].slug}`} className="block">
            <PrintImage
              session={sessions[0]}
              alt={`${sessions[0].title} session`}
              className="aspect-[3/4] w-full"
              sizes="(min-width: 768px) 33vw, 50vw"
            />
            <p className="micro mt-3">Or start with {sessions[0].title} →</p>
          </Link>
        )}
      </div>
    </section>
  );
}
