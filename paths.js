var src = {};

src.app = [
    'src/clinic.js',
    'src/app.js'
];

src.prd = [
    'src/index.js'
].concat(src.app, [
    'src/init.js'
]);

module.exports = {
    src: src,
    dest: {prd: 'go-app.js'},
    test: {
        spec: [
            'test/**/*.test.js'
        ],
        requires: [
            'test/setup.js'
        ]
    }
};
