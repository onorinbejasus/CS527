let App = {};
App.ctrlPts_ = [];

function B_0(t) {
    let myt = 1.0 - t;
    return (myt*myt*myt/6.0);
}

function B_1(t) {
    return ((3.0*t*t*t - 6.0*t*t + 4.0)/6.0);
}

function B_2(t){
    return ((-3.0*t*t*t + 3.0*t*t +3*t+ 1.0)/6.0);
}

function B_3(t){
    return (t*t*t/6.0);
}

// cubic is the piecewise, t is the simulation time
function eval(cubic, t) {
    let i = cubic;
    return (B_0(t)
        * App.ctrlPts_[i] + B_1(t)
        * App.ctrlPts_[i+1] + B_2(t)
        * App.ctrlPts_[i+2] + B_3(t) * App.ctrlPts_[i+3]);
}