class PrerequisitoryGrapher {
    INVERSE_ASPECT_RATIO = .15;
    HORIZONTAL_NODE_RATIO = .8;
    constructor(semesters) {
        this.semesters = semesters;
        this.graph = undefined;
        this.coordToNode = {};

        this.courses = [];
        this.maxCourseCountInSemesters = 9;
        for (let i = 0; i < this.semesters.length; i++) {
            let courseCount = this.semesters[i].length;
            if (courseCount > this.maxCourseCountInSemesters)
                this.maxCourseCountInSemesters = courseCount;

            for (let j = 0; j < courseCount; j++)
                this.courses.push(this.semesters[i][j]);
        }
    }

    createGraph(calculateSize) {
        let [w, h] = calculateSize();
        this.graph = new G6.Graph({
            // String | HTMLElement, required, the id of DOM element or an HTML node
            container: 'mountNode',
            width: w,
            height: h,
        });

        let [nodes, edges] = this.getNodesAndEdges();
        this.graph.data({
            nodes: nodes,
            edges: edges,
        });

        this.updateGraphSize(w, h);
        window.onresize = () => {
            let [w, h] = calculateSize();
            this.updateGraphSize(w, h);
        }
    }

    updateGraphSize(w, h) {
        this.graph.changeSize(w, h);

        for (let i = 0; i < Object.keys(this.coordToNode).length; i++) {
            let coord = Object.keys(this.coordToNode)[i];
            let coords = coord.split(":")

            let node = this.coordToNode[coord];

            let nodePos;
            let nodeSize;
            if (this.isInfoNode(node)) {
                nodePos = this.getInfoNodePos(parseInt(coords[1].trim()), w);
                nodeSize = this.getInfoNodeSize(w);
            } else {
                nodePos = this.getNodePos(parseInt(coords[0].trim()), parseInt(coords[1].trim()), w);
                nodeSize = this.getNodeSize(w);
            }

            node.x = nodePos[0];
            node.y = nodePos[1];
            node.size = nodeSize;
            node.style.radius = [nodeSize[1] * .2];
            node.labelCfg.style.fontSize = this.getNodeSize(w)[1] * .15 * (this.isInfoNode(node) ? 1.5 : 1);
        }
        this.graph.refresh();
    }

    getInfoNodePos(y, w) {
        let size = this.getInfoNodeSize(w);

        return [
            size[0] * .5,
            (y + .5) * this.calculateSemesterHeight(w),
        ];
    }

    getNodePos(x, y, w) {
        let size = this.getNodeSize(w);
        let courseDiff = (this.maxCourseCountInSemesters - this.semesters[y].length);

        return [
            (x + .5 + courseDiff * .5) * size[0] / this.HORIZONTAL_NODE_RATIO,
            (y + .5) * this.calculateSemesterHeight(w),
        ];
    }

    getInfoNodeSize(w) {
        return [
            w,
            this.calculateSemesterHeight(w) * .9
        ];
    }

    getNodeSize(w) {
        let maxWidth = this.getInfoNodeSize(w)[0];
        let height = this.calculateSemesterHeight(w) * .5;

        return [
            maxWidth / this.maxCourseCountInSemesters * this.HORIZONTAL_NODE_RATIO,
            height
        ];
    }

    calculateSemesterHeight(w) {
        return w * this.INVERSE_ASPECT_RATIO;
    }

    getNodesAndEdges() {
        this.coordToNode = {};
        let nodes = [];
        let edges = [];
        let usedSelectiveCourseCodes = [];
        for (let i = 0; i < this.semesters.length; i++) {
            let infoNode = this.getInfoNode(0, i,
                this.semesters[i].length == 0 ? "Bu Dönem İçin Program Bulunmamaktadır" : "");
            this.coordToNode["-0:" + i.toString()] = infoNode;
            nodes.push(infoNode);

            for (let j = 0; j < this.semesters[i].length; j++) {
                let course = this.semesters[i][j];
                if (course.constructor.name === "CourseGroup") {
                    // TEMP CODE
                    let courseCode = "";
                    for (let i = 0; i < course.courses.length; i++) {
                        courseCode = course.courses[i].courseCode;
                        if (!usedSelectiveCourseCodes.includes(courseCode)) break;
                    }
                    usedSelectiveCourseCodes.push(courseCode);
                    let node = this.getNode(new Course("#" + courseCode + "#", course.title, "", ""), j, i);
                    this.coordToNode[j.toString() + ":" + i.toString()] = node;
                    nodes.push(node);
                    // TODO: Implement Selective Courses.
                    continue;
                }

                let node = this.getNode(course, j, i);
                this.coordToNode[j.toString() + ":" + i.toString()] = node;
                nodes.push(node);

                if (course.requirements == undefined) continue;
                for (let y = 0; y < course.requirements.length; y++) {
                    for (let x = 0; x < course.requirements[y].length; x++) {
                        const requiredCourse = course.requirements[y][x];
                        if (this.courses.includes(requiredCourse) && !this.semesters[i].includes(requiredCourse)) {
                            edges.push(this.getEdge(this.courseToNodeId(requiredCourse), this.courseToNodeId(course)))
                            break;
                        }
                    }
                }
            }
        }

        return [nodes, edges];
    }

    getEdges() {
        for (let i = 0; i < this.semesters.length; i++) {
            for (let j = 0; j < this.semesters[i].length; j++) {
                let course = this.semesters[i][j];
                if (course.constructor.name === "CourseGroup") {
                    // TODO: Implement Selective Courses.
                    continue;
                }

            }
        }

        return edges;
    }

    courseToNodeId(course) {
        return course.courseCode.toLowerCase().replace(" ", "");
    }

    isInfoNode(node) {
        return node.id.includes("info_node");
    }

    getInfoNode(x, y, label) {
        return {
            id: "info_node " + y.toString(), // String, unique and required
            x: x, // Number, the x coordinate
            y: y * 10, // Number, the y coordinate
            label: label, // The label of the node
            size: this.graph.width,
            type: "rect",
            style: {
                fill: 'white', // The filling color of nodes
                opacity: .05,
            },
            labelCfg: {
                position: 'center',
                style: {
                    fill: "white",
                    fontSize: 20,
                },
            },
        }
    }

    getNode(course, x, y) {
        return {
            id: this.courseToNodeId(course), // String, unique and required
            x: x, // Number, the x coordinate
            y: y, // Number, the y coordinate
            label: course.courseCode, // The label of the node
            size: [50, 50],
            type: "rect",
            style: {
                fill: 'steelblue', // The filling color of nodes
                stroke: 'grey', // The stroke color of nodes
                lineWidth: 2, // The line width of the stroke of nodes
                radius: [10],
            },
            labelCfg: {
                position: 'center',
                style: {
                    fill: "white",
                    fontSize: 20,
                },
            },
            anchorPoints: [
                [.5, 1],
                [.5, 0],
            ],
        }
    }

    getEdge(s, t) {
        return {
            source: s,
            target: t,
            type: 'cubic-vertical',
            style: {
                endArrow: true,
                lineWidth: 1,
                stroke: 'grey',
                // lineDash: [5],
            },
        }
    }
}