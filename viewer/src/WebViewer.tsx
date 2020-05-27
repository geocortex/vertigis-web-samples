import { makeStyles } from "@material-ui/core/styles";
import React, { useEffect, useState } from "react";
import Sample from "./Sample";

interface WebViewerProps {
    sample: Sample;
}

const useStyles = makeStyles((theme) => ({
    root: {
        border: `1px solid ${theme.palette.divider}`,
        flexGrow: 1,
        minHeight: 500,
    },
}));

const viewerUrl = `${process.env.PUBLIC_URL}/viewer/index.html#no-bootstrap`;
const viewerFrameCyId = "viewer-frame";

const urlParams = new URLSearchParams(window.location.search);
const locale = urlParams.get("locale");

/**
 * Handles programmatically loading the viewer to inject the app/layout as well
 * as custom lib.
 * NOTE: Loading the viewer programmatically is for demonstration
 * purposes, and is NOT recommended in production.
 */
function loadSample(sample: Sample, iframe: HTMLIFrameElement) {
    const iframeDocument = iframe.contentDocument;

    if (!iframeDocument) {
        throw new Error("Web frame failed to load");
    }

    function bootstrap() {
        let iframeWindow = iframe.contentWindow as
            | (Window & { require: any })
            | null;

        if (!iframeWindow || !iframeWindow.require) {
            throw new Error("Web frame failed to load");
        }

        iframeWindow.require(["require", "gwv"], function (require, webViewer) {
            function getAbsoluteUrl(relativePath) {
                const a = document.createElement("a");
                a.href = relativePath;
                return a.href;
            }

            // Load common web libs as well as our custom bundle
            require([
                "@geocortex/web-libraries!/common",
                "@geocortex/web-libraries!/web",
                sample.library,
            ], (...libs) => {
                const options = {
                    appConfig: sample.app,
                    layout: getAbsoluteUrl(sample.layout),
                    libraries: libs.map((lib) => lib.default),
                    locale,
                };
                webViewer.bootstrap(options);
            });
        });
    }

    if (iframeDocument.readyState === "complete") {
        bootstrap();
    } else {
        iframeDocument.addEventListener("DOMContentLoaded", bootstrap);
    }
}

/**
 * Handles the load event when a custom page was supplied for the sample.
 * This is useful to demonstrate iframe type examples.
 */
function handleSampleFrameLoad(sample: Sample, iframe: HTMLIFrameElement) {
    const iframeDocument = iframe.contentDocument;

    if (!iframeDocument) {
        throw new Error("Couldn't access sample frame document.");
    }

    const nestedFrame = iframeDocument.getElementById(
        "viewer"
    ) as HTMLIFrameElement | null;

    if (!nestedFrame) {
        throw new Error("Couldn't find nested viewer frame.");
    }

    loadSample(sample, nestedFrame);
}

function WebViewer(props: WebViewerProps) {
    const { sample } = props;

    const styles = useStyles();
    const [sampleHtml, setSampleHtml] = useState<string>();

    useEffect(() => {
        if (!sample?.page) {
            return;
        }

        let didCancel = false;

        (async () => {
            const response = await fetch(sample.page);
            const html = await response.text();

            const doc = new DOMParser().parseFromString(html, "text/html");
            const nestedFrame = doc.getElementById(
                "viewer"
            ) as HTMLIFrameElement | null;

            if (!nestedFrame) {
                throw new Error("Couldn't find nested viewer frame.");
            }

            // Update to use same URL that we use to load our other samples
            nestedFrame.src = viewerUrl;
            nestedFrame.dataset.cy = viewerFrameCyId;

            setSampleHtml(doc.documentElement.innerHTML);

            if (didCancel) {
                return;
            }
        })();

        return () => {
            didCancel = true;
        };
    }, [sample]);

    if (!sample || (sample.page && !sampleHtml)) {
        return null;
    }

    if (sample.page) {
        return (
            <iframe
                className={styles.root}
                data-cy="viewer-outer-frame"
                srcDoc={sampleHtml}
                title="Sample preview"
                onLoad={(event) => {
                    const iframe = event.currentTarget;
                    handleSampleFrameLoad(sample, iframe);
                }}
            />
        );
    }

    return (
        <iframe
            className={styles.root}
            data-cy={viewerFrameCyId}
            src={viewerUrl}
            title="Sample preview"
            onLoad={(event) => {
                const iframe = event.currentTarget;
                loadSample(sample, iframe);
            }}
        />
    );
}

export default WebViewer;
