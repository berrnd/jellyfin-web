define(['userSettings', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'focusManager', 'homeSections', 'emby-itemscontainer'], function (userSettings, loading, connectionManager, appHost, layoutManager, focusManager, homeSections) {
    'use strict';

    function HomeTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.currentApiClient();
        this.sectionsContainer = view.querySelector('.sections');
        view.querySelector('.sections').addEventListener('settingschange', onHomeScreenSettingsChanged.bind(this));
    }

    function onHomeScreenSettingsChanged() {
        this.sectionsRendered = false;

        if (!this.paused) {
            this.onResume({
                refresh: true
            });
        }
    }

    HomeTab.prototype.onResume = function (options) {
        if (this.sectionsRendered) {
            var sectionsContainer = this.sectionsContainer;

            if (sectionsContainer) {
                return homeSections.resume(sectionsContainer, options);
            }

            return Promise.resolve();
        }

        loading.show();
        var view = this.view;
        var apiClient = this.apiClient;
        this.destroyHomeSections();
        this.sectionsRendered = true;
        return apiClient.getCurrentUser().then(function (user) {
            return homeSections.loadSections(view.querySelector('.sections'), apiClient, user, userSettings).then(function () {
                if (options.autoFocus) {
                    focusManager.autoFocus(view);
                }

                // bb: Added library statistics
                ApiClient.getItemCounts().then(function (itemCounts)
                {
                    document.getElementById("statisticsMovieCount").textContent = itemCounts.MovieCount;
                    document.getElementById("statisticsSeriesCount").textContent = itemCounts.SeriesCount;
                    document.getElementById("statisticsEpisodesCount").textContent = itemCounts.EpisodeCount;
                });
                ApiClient.getJSON('/LibraryStatistics').then(function (libraryStatistics)
                {
                    document.getElementById("statisticsTotalRunTime").textContent = GermanDuration(libraryStatistics.TotalRunTimeTicks);
                    document.getElementById("statisticsTotalFileSize").textContent = HumanizeFileSize(libraryStatistics.TotalFileSize);
                    document.getElementById("statisticsTotalFileSizeWithRedundancy").textContent = HumanizeFileSize(libraryStatistics.TotalFileSizeWithRedundancy);
                });

                loading.hide();
            });
        });
    };

    HomeTab.prototype.onPause = function () {
        var sectionsContainer = this.sectionsContainer;

        if (sectionsContainer) {
            homeSections.pause(sectionsContainer);
        }
    };

    HomeTab.prototype.destroy = function () {
        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.destroyHomeSections();
        this.sectionsContainer = null;
    };

    HomeTab.prototype.destroyHomeSections = function () {
        var sectionsContainer = this.sectionsContainer;

        if (sectionsContainer) {
            homeSections.destroySections(sectionsContainer);
        }
    };

    return HomeTab;
});
