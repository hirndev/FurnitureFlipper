const path = require("path");
const Furniture = require(path.join(__dirname, "../models/dbFurniture"));

const timestampToday = require(path.join(__dirname, "../utils/timeFunc"));

module.exports.index = async (req, res) => {
  const curPageNum = req.query.page ? req.query.page : 1;
  const options = {
    page: curPageNum,
    limit: 8,
    collation: {
      locale: "en",
    },
    sort: { _id: -1 },
  };
  await Furniture.paginate({}, options, function (err, result) {
    return res.render("furniture/", {
      result,
      title: "All Listings",
    });
  });
  // FOR ENTIRE LISTING ON SINGLE PAGE RENDER (NO PAGINATE)
  // const all_furniture = await Furniture.find().sort({ _id: -1 });
  // res.render("furniture/", { all_furniture, title: "All Listings" });
};

module.exports.allmaps = async (req, res) => {
  // API to respond with all lat & lng for MapMarker
  const all_furniture = await Furniture.find({}, "title lat lng");
  res.json(all_furniture);
};

module.exports.mapview = async (req, res) => {
  res.render("furniture/map", { title: "Map Listed" });
};

module.exports.searchFurniture = async (req, res) => {
  const curPageNum = req.query.page ? req.query.page : 1;
  const searchString = req.query.q;
  const searchRegex = new RegExp(searchString, "i");
  // const all_furniture = await Furniture.find({}).sort({ _id: -1 }).limit(25);
  // console.log(all_furniture);
  const options = {
    page: curPageNum,
    limit: 8,
    collation: {
      locale: "en",
    },
    sort: { _id: -1 },
  };
  await Furniture.paginate(
    { title: searchRegex },
    options,
    function (err, result) {
      // console.log(result.docs);
      res.render("furniture/search", {
        result,
        searchString,
        title: "Search",
      });
    }
  );
};

module.exports.userFurnitureList = async (req, res) => {
  const curPageNum = req.query.page ? req.query.page : 1;
  const options = {
    page: curPageNum,
    limit: 8,
    collation: {
      locale: "en",
    },
    sort: { _id: -1 },
  };
  await Furniture.paginate(
    { author: req.user._id },
    options,
    function (err, result) {
      // console.log(result.docs);
      return res.render("furniture/mylist", { result, title: "My List" });
    }
  );
};

module.exports.renderNew = (req, res) => {
  res.render("furniture/new", { title: "New" });
};

module.exports.new = async (req, res) => {
  const new_furniture = new Furniture(req.body.furniture);
  new_furniture.timestamp = timestampToday;
  new_furniture.author = req.user._id;
  new_furniture.imageurl = req.files.map((f) => ({
    // ENABLE THIS FOR CLOUDINARY STORAGE, WHEN DEPLOYED.
    // url: f.path,
    // REMOVE BELOW FOR CLOUDINARY STORAGE, WHEN DEPLOYED.
    url: "/temp/uploads/" + f.filename,
    filename: f.filename,
  }));
  await new_furniture.save();
  res.redirect("/furniture/" + new_furniture._id);
};

module.exports.read = async (req, res) => {
  const selectedFurniture = await Furniture.findById(req.params.id)
    .populate("author")
    .populate({
      path: "questions",
      populate: {
        path: "author",
      },
      options: { sort: { _id: -1 }, limit: 10 },
    }); /*can populate directly but needed options, sort here for latest questions*/
  res.render("furniture/show", { selectedFurniture, title: "View" });
};

module.exports.renderEdit = async (req, res) => {
  const selectedFurniture = await Furniture.findById(req.params.id);
  res.render("furniture/edit", { selectedFurniture, title: "Edit" });
};

module.exports.update = async (req, res, next) => {
  const edited_furniture = req.body.furniture;
  const newEdit_furniture = await Furniture.findByIdAndUpdate(req.params.id, {
    title: edited_furniture.title,
    price: edited_furniture.price,
    // imageurl: edited_furniture.imageurl,
    desc: edited_furniture.desc,
  });
  const newimgs = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  newEdit_furniture.imageurl.push(...newimgs);
  newEdit_furniture.save();
  res.redirect(`/furniture/${req.params.id}`);
};

module.exports.delete = async (req, res) => {
  await Furniture.findByIdAndDelete(req.params.id);
  //This deletes the questions with post Middleware that executes after findOneAndDelete in dbFurniture Schema
  res.redirect("/furniture");
};
