import router from "../../Kernel/Router.ts";

router.get("/", (req, res) => {
    res.send("Hello");
});

export default router;