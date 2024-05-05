// ==UserScript==
// @name         Teachable Time Helper
// @namespace    http://tampermonkey.net/
// @version      2024-05-05
// @description  Calculate and display amount of time spent watching lectures and how much time remains to be spent watching lectures for the course.
// @author       Daniel Hillis
// @match        https://learn.cantrill.io/courses/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cantrill.io
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    class Section {
        constructor(sectionName){
            this.name = sectionName;
            this.totalSeconds = 0;
            this.completedSeconds = 0;
        }
    }

    function getDurationString(timeInSeconds) {
        let hours = Math.trunc(timeInSeconds/3600);
        let hoursRemainder = timeInSeconds%3600;
        let minutes = Math.trunc(hoursRemainder/60);
        let seconds = hoursRemainder%60;
        return (hours.toString()
                .concat(':')
                .concat(String(minutes).padStart(2, '0'))
                .concat(':')
                .concat(String(seconds).padStart(2, '0')));
    }

    var sections = $('.course-mainbar div.row div.course-section');
    var sectionCount = sections.length;
    var sectionCourses = $('.course-mainbar div.row div.course-section ul.section-list');
    var lectureCount = $('span.lecture-name').length
    console.info("sectionCount:" + sectionCount);

    const regexpCourseDurationHHMM = /([0-9]{1,2})(?=:):([0-9]{2})/;
    const sectionMap = new Map();

    console.info("teachable helper starting...");


    var sections = $('.course-mainbar div.row div.course-section');
    var sectionCount = sections.length;
    var lectureCount = $('span.lecture-name').length

    let overallDurationSeconds = 0;
    let overallDurationCompletedSeconds = 0;

    for(let sec of document.querySelectorAll(".course-mainbar div.row div.course-section")) {
        let currentSection = sec.querySelector("div.section-title").innerText;
        console.info('sec:', currentSection);
        // store the map for this section
        sectionMap.set(currentSection, new Section(currentSection));
        for(let c of sec.querySelectorAll("ul.section-list li.section-item")) {
            let courseName = c.querySelector("span.lecture-name").innerText;
            let completed = c.classList.contains("completed");
            console.info('c:', courseName, ', completed:', completed);
            // courseName sample:
            // [ASSOCIATESHARED] [DEMO] Automated EC2 Control using Lambda and Events - PART2 (18:49 )

            // get duration from the course title
            let duration = courseName.match(regexpCourseDurationHHMM);

            if (duration && duration.length === 3){
                let minutes = parseInt(duration[1]);
                let seconds = parseInt(duration[2]);
                let courseTotalSeconds = seconds + ( minutes * 60 );
                // console.info('total seconds: ', totalSeconds);
                let currentSectionCounts = sectionMap.get(currentSection);
                currentSectionCounts.totalSeconds+= courseTotalSeconds;
                overallDurationSeconds += courseTotalSeconds;
                if (completed){
                    currentSectionCounts.completedSeconds+= courseTotalSeconds;
                    overallDurationCompletedSeconds+= courseTotalSeconds;
                }
            }
        }
    }
    console.info(`overall duration: ${getDurationString(overallDurationSeconds)}`);

    for (const [key, value] of sectionMap) {
        console.log(`${key}`);
        console.log(`total duration: ${getDurationString(value.totalSeconds)}`);
        console.log(`completed: ${getDurationString(value.completedSeconds)}`);
        console.log(`remaining: ${getDurationString(value.totalSeconds - value.completedSeconds)}`);
    }
    $('.course-mainbar .section-title').first().append("<p>Section Count: " + sectionCount.toString() + "</p>");
    $('.course-mainbar .section-title').first().append("</p><p>Lecture Count: " + lectureCount.toString() + "</p>");
    $('.course-mainbar .section-title').first().append("</p><p>Total Duration    : " + getDurationString(overallDurationSeconds) + "</p>");
    $('.course-mainbar .section-title').first().append("</p><p>Completed Duration: " + getDurationString(overallDurationCompletedSeconds) + "</p>");
    $('.course-mainbar .section-title').first().append("</p><p>Remaining Duration: " + getDurationString(overallDurationSeconds - overallDurationCompletedSeconds) + "</p>");

})();