var express=require("express");
var app=express();
var bodyParser=require("body-parser");
var mongoose=require("mongoose"),
	passport=require("passport"),
	passportLocalMongoose=require("passport-local-mongoose"),
	localStrategy=require("passport-local");

var projectSchema = new mongoose.Schema({
	name:String,
	title:String,
	description:String
});

var Project=mongoose.model("Project",projectSchema);

var userSchema=new mongoose.Schema({
	username:String,
	password:String
});
userSchema.plugin(passportLocalMongoose);

var User=mongoose.model("User",userSchema);

app.use(bodyParser.urlencoded({extended:true,useNewUrlParser: true}));

app.set("view engine","ejs");

mongoose.connect("mongodb://localhost/WIP");

app.use(express.static(__dirname+"/public"));

app.use(require("express-session")({
	secret:"hi there",
	resave:false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req,res,next){
	res.locals.currentUser=req.user;
	next();
});


app.get("/",function(req,res){
	res.render("home");
});

app.get("/projects",function(req,res){
	Project.find({},function(err,allProjects){
		if(err){
			console.log(err);
		}else{
			res.render("projects",{projects:allProjects});
		}
	});
});

app.get("/projects/new",isLoggedIn,function(req,res){
	res.render("new");
});

app.post("/projects",isLoggedIn,function(req,res){
	var name=req.body.name;
	var title=req.body.title;
	var desc=req.body.description;
	var newProject={name:name,title:title,description:desc};
	Project.create(newProject,function(err,newlyCreated){
		if(err){
			console.log(err);
		}else{
			res.redirect("/projects");
		}
	});
});

app.get("/projects/:id",function(req,res){
	Project.findById(req.params.id),function(err,foundProject){
		if(err){
			console.log(err);
		}else{
			console.log(foundProject);
			res.render("show",{project:foundProject});
		}
	};
});

app.get("/register",function(req,res){
	res.render("register");
});

app.post("/register",function(req,res){
	var newUser=new User({username:req.body.username});
	User.register(newUser,req.body.password,function(err,user){
		if(err){
			console.log(err);
			return res.render("register");
		}
		passport.authenticate("local")(req,res,function(){
			res.redirect("/");
		});
	});
});

app.get("/login",function(req,res){
	res.render("login");
});

//app.post("/login",middleware,callback)
app.post("/login",passport.authenticate("local",
	{
		successRedirect:"/",
		failureRedirect:"/login"
	}),function(req,res){
});

app.get("/logout",function(req,res){
	req.logout();
	res.redirect('/');
});

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}

app.listen(3000,function(){
	console.log("Server has started!!");
});

