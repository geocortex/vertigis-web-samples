import { version } from "esri/kernel";
import MapView from "esri/views/MapView";
import SceneView from "esri/views/SceneView";
import { ComponentModelBase } from "@vertigis/web/models";
import React, { useEffect, useRef } from "react";
import { useWatchAndRerender } from "@vertigis/web/ui";

async function injectCssIfNeeded(): Promise<void> {
    const styleLinkHref = `https://js.arcgis.com/${version}/esri/themes/light/main.css`;

    // Don't inject again if stylesheet already in the document.
    if (document.querySelector(`link[href="${styleLinkHref}"`)) {
        return Promise.resolve();
    }

    // Wait until stylesheet loaded to avoid flash of un-styled DOM.
    return new Promise((resolve, reject) => {
        const styleLink = document.createElement("link");
        styleLink.rel = "stylesheet";
        styleLink.href = styleLinkHref;
        styleLink.onload = () => resolve();
        styleLink.onerror = reject;
        document.head.appendChild(styleLink);
    });
}

export function createEsriMapWidget<M extends ModelWithMap>(
    widgetType: MapWidgetConstructor
): React.ComponentType<MapWidgetProps<M>> {
    return function EsriWidget(props: MapWidgetProps<M>) {
        const { model, onWidgetCreated, onWidgetDestroyed } = props;
        const rootRef = useRef<HTMLDivElement>();

        useWatchAndRerender(model, "map.view");

        useEffect(() => {
            if (!rootRef.current || !model.map?.view) {
                return;
            }

            let isCancelled = false;
            let widget: MapWidget | undefined;

            function createWidget() {
                // If we give Esri's widget a DOM element managed by React, it will
                // delete the element once destroyed, causing React to freak out.
                // Instead, create one manually.
                const container = document.createElement("div");
                rootRef.current.appendChild(container);

                widget = new widgetType({
                    view: model.map.view,
                    container,
                });

                onWidgetCreated?.(widget);
            }

            function destroyWidget() {
                widget.destroy();
                widget = undefined;

                onWidgetDestroyed?.();
            }

            void (async () => {
                await injectCssIfNeeded();

                if (isCancelled) {
                    return;
                }

                createWidget();
            })();

            return () => {
                isCancelled = true;
                destroyWidget();
            };
        }, [model.map?.view, onWidgetCreated, onWidgetDestroyed]);

        return <div ref={rootRef} />;
    };
}

export type MapOrSceneView = MapView | SceneView;
export interface MapWidget extends __esri.Widget {
    view: MapOrSceneView;
}
export type MapWidgetConstructor = new (
    props: __esri.WidgetProperties & {
        view: MapOrSceneView;
        container: HTMLElement;
    }
) => MapWidget;
// TODO: Use correct type for `map` after 5.10 release.
export type ModelWithMap = ComponentModelBase & { map: any };
export interface MapWidgetProps<M extends ModelWithMap> {
    model: M;
    onWidgetCreated?: (widget: MapWidget) => void;
    onWidgetDestroyed?: () => void;
}
