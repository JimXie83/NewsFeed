using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using nf.Models;

namespace nf.Controllers
{
    public class NewsFeedsController : Controller
    {
        private nfContext db = new nfContext();

        // GET: NewsFeeds
        public ActionResult Index()
        {
            return View();
        }

        public void Save(NewsFeed edit_vm)
        {
            //db.
            db.NewsFeeds.Add(edit_vm);
            db.SaveChanges();
        }

        // delete an entry by id
        public void Delete(Object id)
        {            
            NewsFeed newsFeed = db.NewsFeeds.Find(Int32.Parse(id.ToString()));
            db.NewsFeeds.Remove(newsFeed);
            db.SaveChanges();
        }
        // get all records in descending order of date-published
        public Object getAll()
        {
            var items = from i in this.db.NewsFeeds
                       orderby i.date_published descending
                       select i;
            var jsonData = new { rows = items.ToList().ToArray() };
            //Return the result in json
            return Newtonsoft.Json.JsonConvert.SerializeObject(jsonData);
        }
        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
