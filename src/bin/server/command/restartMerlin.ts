import * as lodash from "lodash";
import { merlin } from "../../../lib";
import Session from "../session";

async function restartMerlin(session: Session): Promise<void> {
  await session.merlin.restart();
  // FIXME: put this in a method after refactoring Synchronizer
  for (const document of session.synchronizer.documents.values()) {
    const content = document.getText();
    const request = merlin.Sync.tell("start", "end", content);
    await session.merlin.sync(request, document);
    const tools: Set<string> = new Set(session.settings.reason.diagnostics.tools);
    if (!tools.has("bsb")) {
      await session.analyzer.refreshImmediate(document);
    }
    await new Promise(resolve => {
      session.indexer.populated = false;
      resolve(session.indexer.populate(document));
    });
  }
}

const restartMerlinDebounced = lodash.debounce(restartMerlin, 3000, { trailing: true });

export default restartMerlinDebounced;
